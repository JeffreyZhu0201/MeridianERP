export interface PlatformFundsSummary {
  gmv: string | number;
  wholesaleRevenue: string | number;
  commissionAccrued: string | number;
  commissionSettled: string | number;
  commissionLiability: string | number;
  accruedAwaitingSettlement: string | number;
  pendingWithdrawals: string | number;
  orderCount: number;
  deliveryOrderCount: number;
  from: string;
  to: string;
  /** Daily GMV for trend chart (YYYY-MM-DD → amount) */
  gmvTrend?: Array<{ date: string; amount: number }>;
}

export interface MerchantFundsSummary {
  salesGmv: string | number;
  allocationCost: string | number;
  deliveryAllocationCost: string | number;
  payableCommission: string | number;
  netPosition: string | number;
  from: string;
  to: string;
}

/** @deprecated Use PlatformFundsSummary fields without Last30Days suffix */
export type LegacyPlatformFundsSummary = {
  gmvLast30Days: string | number;
  wholesaleRevenueLast30Days: string | number;
  commissionAccruedLast30Days: string | number;
  commissionSettledLast30Days: string | number;
  pendingWithdrawals: string | number;
  orderCountLast30Days: number;
  deliveryOrderCountLast30Days: number;
};
