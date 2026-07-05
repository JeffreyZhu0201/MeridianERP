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

/** HQ funds dashboard — five headline metrics */
export interface PlatformFundsOverview {
  inventoryCost: number;
  expectedProfit: number;
  procurementSales: number;
  procurementProfit: number;
  distributorCommissions: number;
  netProfit: number;
  from: string;
  to: string;
}

export interface PlatformFundsInventoryCostLine {
  id: string;
  skuCode: string;
  name: string;
  quantityOnHand: number;
  unitCost: string;
  lineCost: number;
}

export interface PlatformFundsExpectedProfitLine {
  id: string;
  skuCode: string;
  name: string;
  quantityOnHand: number;
  unitCost: string;
  wholesalePrice: string;
  expectedProfit: number;
}

export interface PlatformFundsProcurementRow {
  id: string;
  orderNumber: string;
  merchantName: string;
  status: string;
  salesAmount: number;
  costAmount: number;
  profitAmount: number;
  paidAt: string | null;
}

export interface PlatformFundsCommissionRow {
  id: string;
  distributorName: string;
  merchantLabel: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface PlatformFundsNetProfitBreakdown {
  wholesaleFromAllocations: number;
  wholesaleFromDelivery: number;
  totalRevenue: number;
  cogsFromAllocations: number;
  cogsFromDelivery: number;
  totalCogs: number;
  distributorCommissions: number;
  netProfit: number;
  from: string;
  to: string;
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
