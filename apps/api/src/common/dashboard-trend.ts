import { LedgerStatus, OrderStatus, Prisma } from '@prisma/client';
import type { PerformanceTrendPoint } from '@meridian/shared';
import { eachUtcDay } from './date-range';

/**
 * 仪表盘趋势数据构建工具
 *
 * 本模块提供订单趋势聚合功能，用于：
 * - 商户仪表盘订单趋势图
 * - 平台管理后台销售统计
 * - 经销商业绩查看
 *
 * ## 数据流向
 *
 * ```
 * Prisma 查询 → OrderTrendRow[] → buildOrderTrend() → PerformanceTrendPoint[]
 * ```
 *
 * ## 聚合逻辑
 *
 * 每日数据桶（bucket）包含：
 * - orderCount: 当日订单数量
 * - orderRevenue: 当日订单总额（累加所有订单的 total）
 * - commissionAccrued: 当日预提佣金（仅 ACCRUED 状态计入）
 *
 * ## 佣金状态说明
 *
 * - ACCRUED: 已预提，待结算
 * - PAID: 已支付给经销商
 * - CANCELLED: 已取消（不计入）
 *
 * 趋势图只显示 ACCRUED 状态的佣金，因为它代表"应计但未付"的金额。
 */

/**
 * 订单趋势行类型
 *
 * 表示用于计算趋势的订单数据。
 * 通过 Prisma 的 include 预加载 commissionEntry。
 *
 * @example
 * ```typescript
 * const orders = await prisma.order.findMany({
 *   where: { tenantId, createdAt: { gte: from, lte: to } },
 *   include: {
 *     commissionEntry: true  // 预加载佣金条目
 *   }
 * });
 * ```
 */
type OrderTrendRow = {
  createdAt: Date;
  total: Prisma.Decimal;
  commissionEntry?: { amount: Prisma.Decimal; status: LedgerStatus } | null;
};

/**
 * 构建订单趋势数据
 *
 * 将订单数据聚合为每日趋势点，用于绘制趋势图。
 *
 * ## 算法步骤
 *
 * 1. **初始化空桶**：日期范围内每天创建空桶（避免图表断点）
 * 2. **累加订单**：遍历每条订单，累加到对应日期的桶中
 * 3. **转换格式**：将 Map 转换为前端需要的数组格式
 *
 * ## 使用示例
 *
 * ```typescript
 * const { from, to } = parseDateRangeQuery(query, 30);
 *
 * const orders = await prisma.order.findMany({
 *   where: {
 *     tenantId,
 *     createdAt: { gte: from, lte: to },
 *     status: OrderStatus.PAID  // 只统计已付款订单
 *   },
 *   include: { commissionEntry: true }
 * });
 *
 * const trend = buildOrderTrend(from, to, orders);
 * // 返回: [{ date: '2024-01-15', orderCount: 5, orderRevenue: '1500.00', commissionAccrued: '150.00' }, ...]
 * ```
 *
 * @param from - 开始日期（UTC 零点）
 * @param to - 结束日期（UTC 末了）
 * @param orders - 订单列表（需预加载 commissionEntry）
 * @returns 每日趋势点数组
 */
export function buildOrderTrend(
  from: Date,
  to: Date,
  orders: OrderTrendRow[],
): PerformanceTrendPoint[] {
  // 用 Map 存储每日数据（便于快速查找和更新）
  const trendMap = new Map<
    string,
    { orderCount: number; orderRevenue: Prisma.Decimal; commissionAccrued: Prisma.Decimal }
  >();

  // 初始化：日期范围内每天创建空桶
  for (const day of eachUtcDay(from, to)) {
    trendMap.set(day, {
      orderCount: 0,
      orderRevenue: new Prisma.Decimal(0),
      commissionAccrued: new Prisma.Decimal(0),
    });
  }

  // 遍历订单，累加到对应日期的桶
  for (const order of orders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    const bucket = trendMap.get(day);
    if (!bucket) continue; // 跳过不在日期范围内的订单
    bucket.orderCount += 1;
    bucket.orderRevenue = bucket.orderRevenue.plus(order.total);
    // 只累加 ACCRUED 状态的佣金
    if (order.commissionEntry?.status === LedgerStatus.ACCRUED) {
      bucket.commissionAccrued = bucket.commissionAccrued.plus(order.commissionEntry.amount);
    }
  }

  // 转换为返回格式
  return [...trendMap.entries()].map(([date, bucket]) => ({
    date,
    orderCount: bucket.orderCount,
    orderRevenue: bucket.orderRevenue.toString(),
    commissionAccrued: bucket.commissionAccrued.toString(),
  }));
}

/**
 * 已付款订单状态常量
 * 用于查询时快速引用
 */
export const PAID_ORDER_STATUS = OrderStatus.PAID;
