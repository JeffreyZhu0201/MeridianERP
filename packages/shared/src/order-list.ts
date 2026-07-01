import type { FulfillmentType } from './phase-5-distribution.js';

/**
 * 订单列表工具类型和函数
 * 提供订单列表的统一展示格式和辅助函数
 */

/**
 * 订单列表 Tab 类型
 * 用于订单列表页的筛选 Tab
 * - all: 全部订单
 * - pickup: 仅自提订单
 * - delivery: 仅配送订单
 */
export type OrderListTab = 'all' | 'pickup' | 'delivery';

/**
 * 标准化订单列表行
 * 适配管理后台和商户后台的订单列表组件
 * @property id - 订单ID
 * @property customerLabel - 客户标签/名称（用于列表展示）
 * @property status - 订单状态
 * @property fulfillmentType - 履约类型
 * @property total - 订单总金额
 * @property createdAt - 下单时间
 * @property meta - 额外次要提示（如脱敏自提码 "••••42"）
 */
export interface OrderListRow {
  id: string;
  customerLabel: string;
  status: string;
  fulfillmentType: FulfillmentType;
  total: string;
  createdAt: string;
  /** Optional secondary hint — e.g. masked pickup code `••••42`. */
  meta?: string;
}

/**
 * 生成自提码脱敏提示
 * 在订单列表中展示时隐藏完整自提码，仅显示后2位
 * 出于安全考虑，列表页面不应暴露完整自提码
 * @param pickupCode - 原始自提码
 * @returns 脱敏后的提示字符串，如 "••••42"，或 undefined（无法脱敏时）
 */
export function formatPickupCodeHint(
  pickupCode: string | null | undefined,
): string | undefined {
  if (!pickupCode || pickupCode.length < 2) return undefined;
  return `••••${pickupCode.slice(-2)}`;
}
