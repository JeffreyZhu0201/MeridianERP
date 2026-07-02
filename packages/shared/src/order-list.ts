import type { FulfillmentType } from './phase-5-distribution.js';

/**
 * 订单列表 Tab 类型
 * 用于订单列表页的筛选 Tab
 * - all: 全部订单
 * - pickup: 仅自提订单
 * - delivery: 仅配送订单
 */
export type OrderListTab = 'all' | 'pickup' | 'delivery';

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

export function formatPickupCodeHint(
  pickupCode: string | null | undefined,
): string | undefined {
  if (!pickupCode || pickupCode.length < 2) return undefined;
  return `••••${pickupCode.slice(-2)}`;
}
