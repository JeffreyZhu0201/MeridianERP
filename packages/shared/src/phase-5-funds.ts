export interface PlatformFundsSummary {
  gmvLast30Days: string | number;
  wholesaleRevenueLast30Days: string | number;
  commissionAccruedLast30Days: string | number;
  commissionSettledLast30Days: string | number;
  pendingWithdrawals: string | number;
  orderCountLast30Days: number;
  deliveryOrderCountLast30Days: number;
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
