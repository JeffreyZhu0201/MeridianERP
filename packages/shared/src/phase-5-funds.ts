export interface PlatformFundsSummary {
  consumerGmv: string | number;
  /** @deprecated Use consumerGmv */
  gmv: string | number;
  wholesaleFromAllocations: string | number;
  wholesaleFromDelivery: string | number;
  wholesaleRevenue: string | number;
  distributorCommissionAccrued: string | number;
  distributorCommissionSettled: string | number;
  /** @deprecated Use distributorCommissionAccrued */
  commissionAccrued: string | number;
  /** @deprecated Use distributorCommissionSettled */
  commissionSettled: string | number;
  commissionLiability: string | number;
  accruedAwaitingSettlement: string | number;
  pendingWithdrawals: string | number;
  pickupMarginAcrossBranches: string | number;
  orderCount: number;
  deliveryOrderCount: number;
  from: string;
  to: string;
  gmvTrend?: Array<{ date: string; amount: number }>;
}

export interface MerchantFundsSummary {
  pickupGmv: string | number;
  pickupCostOfGoods: string | number;
  pickupGrossProfit: string | number;
  /** @deprecated Use pickupGmv */
  salesGmv: string | number;
  allocationCost: string | number;
  deliveryAllocationCost: string | number;
  netPosition: string | number;
  from: string;
  to: string;
}

export type LegacyPlatformFundsSummary = {
  gmvLast30Days: string | number;
  wholesaleRevenueLast30Days: string | number;
  commissionAccruedLast30Days: string | number;
  commissionSettledLast30Days: string | number;
  pendingWithdrawals: string | number;
  orderCountLast30Days: number;
  deliveryOrderCountLast30Days: number;
};
