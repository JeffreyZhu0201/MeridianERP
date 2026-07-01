/**
 * 日期范围工具函数
 *
 * 本模块提供 UTC 日期处理工具，用于：
 * - 仪表盘数据查询（趋势、统计）
 * - 佣金计算周期
 * - 订单历史筛选
 *
 * ## UTC 处理策略
 *
 * 所有日期计算使用 UTC 时区，确保：
 * - 跨时区一致性：全球用户看到相同的日期划分
 * - 数据库兼容：Prisma 的 DateTime 字段存储为 UTC
 * - 避免时区偏移：不在计算中混入本地时区
 *
 * ## 典型使用场景
 *
 * 1. 仪表盘趋势图：
 *    ```typescript
 *    const { from, to } = parseDateRangeQuery(query, 30);
 *    const trend = buildOrderTrend(from, to, orders);
 *    ```
 *
 * 2. 佣金周期计算：
 *    ```typescript
 *    const start = dashboardWindowStart(); // 默认回溯 90 天
 *    const ledger = await prisma.commissionLedger.findMany({
 *      where: { createdAt: { gte: start } }
 *    });
 *    ```
 */

import { BadRequestException } from '@nestjs/common';
import {
  DEFAULT_COMMISSION_WINDOW_DAYS,
  type DateRangeQuery,
} from '@meridian/shared';

/**
 * YYYY-MM-DD 格式正则表达式
 *
 * 用于识别简单日期格式，与 ISO 格式区分处理。
 * 简单格式会被转换为 UTC 当天的起止时间。
 */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 获取 UTC 日期的零点时间戳
 *
 * ## 用途
 *
 * 日期范围查询的下界：
 * - "今天 00:00:00.000 UTC"
 * - 用于 gte (>=) 查询
 *
 * @param date - 输入日期（会被转换为 UTC）
 * @returns UTC 当天 00:00:00.000 的 Date 对象
 *
 * @example
 * startOfUtcDay(new Date('2024-01-15T10:30:00Z')) // 2024-01-15T00:00:00.000Z
 * startOfUtcDay(new Date('2024-01-15')) // 2024-01-15T00:00:00.000Z (假设本地时区)
 */
export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
}

/**
 * 获取 UTC 日期的 23:59:59.999 时间戳
 *
 * ## 用途
 *
 * 日期范围查询的上界：
 * - "今天 23:59:59.999 UTC"
 * - 用于 lte (<=) 查询
 * - 使用 23:59:59.999 而非 23:59:59 避免边界问题
 *
 * @param date - 输入日期（会被转换为 UTC）
 * @returns UTC 当天 23:59:59.999 的 Date 对象
 */
function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

/**
 * 解析日期字符串
 *
 * ## 支持的格式
 *
 * 1. **YYYY-MM-DD 格式**（如 "2024-01-15"）
 *    - 转换为 UTC 当天的起止时间
 *    - 适用于前端简单日期选择器
 *
 * 2. **ISO 格式**（如 "2024-01-15T10:30:00Z"）
 *    - 直接解析为 Date 对象
 *    - 适用于精确时间点
 *
 * @param value - 日期字符串
 * @param boundary - 边界类型：
 *   - 'start': 返回当天零点（00:00:00.000）
 *   - 'end': 返回当天末了（23:59:59.999）
 * @returns 解析后的 Date 对象
 * @throws BadRequestException 如果日期格式无效或无法解析
 *
 * @example
 * parseDateInput('2024-01-15', 'start') // 2024-01-15T00:00:00.000Z
 * parseDateInput('2024-01-15', 'end')   // 2024-01-15T23:59:59.999Z
 */
function parseDateInput(value: string, boundary: 'start' | 'end'): Date {
  if (DATE_ONLY.test(value)) {
    // YYYY-MM-DD 格式：转换为 UTC 当天边界
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return boundary === 'start' ? startOfUtcDay(date) : endOfUtcDay(date);
  }
  // ISO 格式或其他：直接解析
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`Invalid date: ${value}`);
  }
  return parsed;
}

/**
 * 获取仪表盘默认回溯窗口的起始时间
 *
 * ## 用途
 *
 * 仪表盘和报表的默认日期范围：
 * - 默认回溯 DEFAULT_COMMISSION_WINDOW_DAYS（90天）
 * - 计算：今天 - N 天 = 起始日期
 *
 * ## 计算逻辑
 *
 * ```
 * 起始日期 = 今天 00:00:00 UTC - N 天
 * ```
 *
 * @param days - 回溯天数，默认从 DEFAULT_COMMISSION_WINDOW_DAYS 获取
 * @returns UTC 当天往前 N 天的零点
 *
 * @example
 * // 假设今天是 2024-04-15
 * dashboardWindowStart()      // 2024-01-15T00:00:00.000Z (90天前)
 * dashboardWindowStart(30)    // 2024-03-16T00:00:00.000Z (30天前)
 */
export function dashboardWindowStart(
  days = DEFAULT_COMMISSION_WINDOW_DAYS,
): Date {
  return startOfUtcDay(
    new Date(Date.now() - days * 24 * 60 * 60 * 1000),
  );
}

/**
 * 解析日期范围查询参数
 *
 * ## 查询参数
 *
 * - `from`: 可选，开始日期（不提供则默认回溯 N 天）
 * - `to`: 可选，结束日期（不提供则默认今天）
 *
 * ## 默认行为
 *
 * - 未提供 from/to：使用回溯窗口（今天 - defaultDays ~ 今天）
 * - 只提供 from：从 from ~ 今天
 * - 只提供 to：从 今天 - defaultDays ~ to
 * - 同时提供 from 和 to：使用提供的范围
 *
 * @param query - 包含可选的 from/to 日期的查询对象
 * @param defaultDays - 未提供日期时的默认回溯天数
 * @returns 解析后的日期范围对象
 * @throws BadRequestException 如果 from 大于 to
 *
 * @example
 * // 假设今天是 2024-04-15
 * parseDateRangeQuery({})  // { from: 2024-01-15, to: 2024-04-15T23:59:59.999Z }
 * parseDateRangeQuery({ from: '2024-03-01' })  // { from: 2024-03-01, to: 2024-04-15 }
 * parseDateRangeQuery({ from: '2024-03-01', to: '2024-03-31' }) // 指定范围
 */
export function parseDateRangeQuery(
  query: DateRangeQuery,
  defaultDays = DEFAULT_COMMISSION_WINDOW_DAYS,
): { from: Date; to: Date; fromIso: string; toIso: string } {
  const todayEnd = endOfUtcDay(new Date());

  // 解析 to 日期（默认今天结束）
  const to = query.to ? parseDateInput(query.to, 'end') : todayEnd;
  // 解析 from 日期（默认 to 往前 N 天）
  const from = query.from
    ? parseDateInput(query.from, 'start')
    : startOfUtcDay(
        new Date(to.getTime() - defaultDays * 24 * 60 * 60 * 1000),
      );

  // 验证 from <= to
  if (from > to) {
    throw new BadRequestException('from must be before or equal to to');
  }

  return {
    from,
    to,
    fromIso: from.toISOString(),
    toIso: to.toISOString(),
  };
}

/**
 * 生成日期范围内每天的 YYYY-MM-DD 字符串数组
 *
 * ## 用途
 *
 * - 仪表盘趋势图的 X 轴数据
 * - 填充零数据的日期（避免图表断点）
 *
 * ## 计算逻辑
 *
 * 从 from 开始，每天 +1，直到超过 to：
 * ```
 * from → from+1d → from+2d → ... → to
 * ```
 *
 * @param from - 开始日期（包含）
 * @param to - 结束日期（包含）
 * @returns 格式为 YYYY-MM-DD 的日期字符串数组
 *
 * @example
 * eachUtcDay(
 *   new Date('2024-01-15'),
 *   new Date('2024-01-18')
 * ) // ['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18']
 */
export function eachUtcDay(from: Date, to: Date): string[] {
  const days: string[] = [];
  let cursor = startOfUtcDay(from);
  const end = startOfUtcDay(to);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return days;
}
