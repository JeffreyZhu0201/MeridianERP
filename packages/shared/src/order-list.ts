import type { FulfillmentType } from './phase-5-distribution.js';

export type OrderListTab = 'all' | 'pickup' | 'delivery';

/** Normalized row for admin / merchant order list adapters. */
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

/** Mask pickup code for list display — never expose full code in tables. */
export function formatPickupCodeHint(
  pickupCode: string | null | undefined,
): string | undefined {
  if (!pickupCode || pickupCode.length < 2) return undefined;
  return `••••${pickupCode.slice(-2)}`;
}
