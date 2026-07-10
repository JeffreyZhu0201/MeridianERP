export declare function sumAllocationLineCost(lines: Array<{
    quantity: number;
    wholesalePrice: string | number;
}>): number;
export declare function pickupOrderGrossProfit(orderTotal: number, lines: Array<{
    quantity: number;
    unitWholesalePrice: string | number | null | undefined;
}>): number;
export declare function computeBranchNetPosition(input: {
    pickupGrossProfit: number;
    allocationCost: number;
    deliveryCost: number;
}): number;
export declare function computeBranchNetPositionLegacy(input: {
    salesGmv: number;
    allocationCost: number;
    deliveryCost: number;
    payableCommission: number;
}): number;
export declare function computePlatformWholesaleRevenue(allocationCost: number, deliveryCost: number): number;
export declare function computeCommissionLiability(accrued: number, settled: number): number;
export declare function computeInventoryCost(skus: Array<{
    quantityOnHand: number;
    unitCost: string | number;
}>): number;
export declare function computeExpectedInventoryProfit(skus: Array<{
    quantityOnHand: number;
    unitCost: string | number;
    wholesalePrice: string | number;
}>): number;
export declare function computePlatformNetProfit(input: {
    wholesaleRevenue: number;
    cogs: number;
    distributorCommissions: number;
}): number;
