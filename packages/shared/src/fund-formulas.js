"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sumAllocationLineCost = sumAllocationLineCost;
exports.pickupOrderGrossProfit = pickupOrderGrossProfit;
exports.computeBranchNetPosition = computeBranchNetPosition;
exports.computeBranchNetPositionLegacy = computeBranchNetPositionLegacy;
exports.computePlatformWholesaleRevenue = computePlatformWholesaleRevenue;
exports.computeCommissionLiability = computeCommissionLiability;
exports.computeInventoryCost = computeInventoryCost;
exports.computeExpectedInventoryProfit = computeExpectedInventoryProfit;
exports.computePlatformNetProfit = computePlatformNetProfit;
function sumAllocationLineCost(lines) {
    return lines.reduce((sum, l) => sum + Number(l.wholesalePrice) * l.quantity, 0);
}
function pickupOrderGrossProfit(orderTotal, lines) {
    const cost = lines.reduce((sum, line) => {
        const wholesale = line.unitWholesalePrice;
        if (wholesale == null)
            return sum;
        return sum + Number(wholesale) * line.quantity;
    }, 0);
    return Number((orderTotal - cost).toFixed(2));
}
function computeBranchNetPosition(input) {
    return (input.pickupGrossProfit -
        input.allocationCost -
        input.deliveryCost);
}
function computeBranchNetPositionLegacy(input) {
    return (input.salesGmv -
        input.allocationCost -
        input.deliveryCost -
        input.payableCommission);
}
function computePlatformWholesaleRevenue(allocationCost, deliveryCost) {
    return allocationCost + deliveryCost;
}
function computeCommissionLiability(accrued, settled) {
    return accrued + settled;
}
function computeInventoryCost(skus) {
    return skus.reduce((sum, sku) => sum + sku.quantityOnHand * Number(sku.unitCost), 0);
}
function computeExpectedInventoryProfit(skus) {
    return skus.reduce((sum, sku) => {
        const margin = Number(sku.wholesalePrice) - Number(sku.unitCost);
        return sum + sku.quantityOnHand * margin;
    }, 0);
}
function computePlatformNetProfit(input) {
    return Number((input.wholesaleRevenue - input.cogs - input.distributorCommissions).toFixed(2));
}
//# sourceMappingURL=fund-formulas.js.map