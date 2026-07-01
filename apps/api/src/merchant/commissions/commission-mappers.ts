import type { CommissionLedger, Distributor, Order, SettlementBatch } from '@prisma/client';
import type { CommissionStatementRow } from '@meridian/shared';

/**
 * 佣金账本数据映射函数
 *
 * ========================================
 * 模块职责
 * ========================================
 * 本模块提供 Prisma 查询结果与前端数据模型之间的转换函数。
 *
 * 设计原则：
 * - 单一职责：每函数只做一件事
 * - 无副作用：纯函数，便于测试
 * - 精度保证：所有金额以字符串传输，避免 JSON 精度丢失
 *
 * ========================================
 * 导出函数
 * ========================================
 *
 * formatOrderReference(orderId) - 格式化订单引用号
 *   - 输入：完整订单 ID
 *   - 输出：订单 ID 后 8 位大写字母
 *   - 用途：前端显示的短订单号
 *
 * formatSettlementBatchPeriod(batch) - 格式化结算批次周期
 *   - 输入：SettlementBatch 实体（periodStart, periodEnd）
 *   - 输出：格式化的日期范围字符串 "YYYY-MM-DD — YYYY-MM-DD"
 *
 * mapCommissionStatementRow(entry) - 映射佣金账单行
 *   - 输入：CommissionLedger + 关联数据
 *   - 输出：前端 CommissionStatementRow 格式
 *
 * decimalSumToString(value) - Decimal 求和结果转字符串
 *   - 处理 null/undefined 边界情况
 *   - 用于 aggregate 查询结果的格式化
 *
 * ========================================
 * 数据转换流程
 * ========================================
 *
 * Prisma Query Result
 *   │
 *   ▼
 * CommissionLedger + Relations
 *   │
 *   ▼
 * mapCommissionStatementRow()
 *   │
 *   ▼
 * CommissionStatementRow (前端 DTO)
 *   │
 *   ▼
 * JSON serialize → 前端 JavaScript
 *
 * ========================================
 * 金额精度说明
 * ========================================
 * Prisma Decimal → toString() → 前端字符串
 * - Decimal 精度：数据库 DECIMAL(12,2)
 * - 前端使用字符串避免 JSON.parse 精度丢失
 * - 前端显示时自行处理格式化（如千分位）
 *
 * @module CommissionMappers
 */

/**
 * 格式化订单引用号（用于前端显示）
 *
 * 原理：取订单 ID 的后 8 位字符并转为大写
 * 目的：提供可读性更好的订单标识，同时避免暴露完整 ID
 *
 * @param orderId - 完整订单 ID（通常为 CUID 格式）
 * @returns 8 位大写字母组成的订单引用号
 *
 * @example
 * formatOrderReference('clr8j9tm0000k0gl3g5test01') // => 'TEST0101'
 */
export function formatOrderReference(orderId: string): string {
  return orderId.slice(-8).toUpperCase();
}

/**
 * 格式化结算批次周期（用于前端显示）
 *
 * 将结算批次的起止日期格式化为可读字符串。
 *
 * @param batch - 结算批次信息（需包含 periodStart 和 periodEnd 字段）
 * @returns 格式化的日期范围字符串，格式："YYYY-MM-DD — YYYY-MM-DD"
 *          若 batch 为 null/undefined，返回 null
 *
 * @example
 * formatSettlementBatchPeriod({
 *   periodStart: new Date('2024-01-01'),
 *   periodEnd: new Date('2024-01-31')
 * }) // => "2024-01-01 — 2024-01-31"
 */
export function formatSettlementBatchPeriod(
  batch: Pick<SettlementBatch, 'periodStart' | 'periodEnd'> | null | undefined,
): string | null {
  if (!batch) return null;
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return `${fmt(batch.periodStart)} — ${fmt(batch.periodEnd)}`;
}

type LedgerWithRelations = CommissionLedger & {
  order: Pick<Order, 'total'>;
  distributor: Pick<Distributor, 'id' | 'name' | 'commissionType' | 'commissionRate'>;
  settlementBatch: SettlementBatch | null;
};

/**
 * 将账本记录映射为佣金账单行（核心映射函数）
 *
 * ========================================
 * 转换逻辑
 * ========================================
 *
 * 输入（Prisma 复合对象）：
 * {
 *   id: string,
 *   orderId: string,
 *   tenantId: string,
 *   amount: Decimal,
 *   status: LedgerStatus,
 *   settlementBatchId: string | null,
 *   createdAt: Date,
 *   order: { total: Decimal },
 *   distributor: { id, name, commissionType, commissionRate },
 *   settlementBatch: { periodStart, periodEnd } | null
 * }
 *
 * ↓ 映射转换
 *
 * 输出（CommissionStatementRow）：
 * {
 *   id: string,
 *   orderId: string,
 *   orderReference: string,      // 格式化后的订单号
 *   orderTotal: string,          // 订单总额（字符串）
 *   distributorId: string,
 *   distributorName: string,
 *   commissionType: string,     // 'PERCENT' | 'FIXED'
 *   commissionRate: string,      // 佣金率（字符串）
 *   amount: string,              // 佣金金额（字符串）
 *   status: string,              // 'ACCRUED' | 'SETTLED' | 'VOID'
 *   settlementBatchId: string | null,
 *   settlementBatchPeriod: string | null,
 *   createdAt: string           // ISO 时间字符串
 * }
 *
 * ========================================
 * 字段说明
 * ========================================
 *
 * orderReference: 订单 ID 后 8 位大写，用于前端显示
 * orderTotal: 消费者实际支付金额
 * commissionType + commissionRate: 记录计算方式，便于前端展示
 * amount: 实际佣金金额
 * settlementBatchPeriod: 若已结算，显示结算批次周期
 *
 * ========================================
 * 使用场景
 * ========================================
 * - CommissionsService.list() 返回的 items 数组
 * - 前端佣金账单列表组件
 *
 * @param entry - 包含账本、订单、经销商、结算批次关联的 Prisma 查询结果
 * @returns 前端所需的佣金账单行格式（CommissionStatementRow）
 */
export function mapCommissionStatementRow(
  entry: LedgerWithRelations,
): CommissionStatementRow {
  return {
    id: entry.id,
    orderId: entry.orderId,
    orderReference: formatOrderReference(entry.orderId),
    orderTotal: entry.order.total.toString(),
    distributorId: entry.distributorId,
    distributorName: entry.distributor.name,
    commissionType: entry.distributor.commissionType,
    commissionRate: entry.distributor.commissionRate.toString(),
    amount: entry.amount.toString(),
    status: entry.status as CommissionStatementRow['status'],
    settlementBatchId: entry.settlementBatchId,
    settlementBatchPeriod: formatSettlementBatchPeriod(entry.settlementBatch),
    createdAt: entry.createdAt.toISOString(),
  };
}

/**
 * 将 Decimal 求和结果转为字符串（空值安全处理）
 *
 * 用于 Prisma aggregate 查询的结果格式化。
 * aggregate 返回的 _sum.amount 可能是 null（无记录时）。
 *
 * @param value - Prisma Decimal 类型或 null/undefined
 * @returns 字符串形式的金额，"0" 表示空值
 *
 * @example
 * decimalSumToString(null) // => "0"
 * decimalSumToString(Decimal(50)) // => "50"
 */
export function decimalSumToString(
  value: { toString(): string } | null | undefined,
): string {
  if (value == null) return '0';
  return value.toString();
}
