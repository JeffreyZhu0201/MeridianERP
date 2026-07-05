export function sumAllocationLineCost(
  lines: Array<{ quantity: number; wholesalePrice: string | number }>,
): number {
  return lines.reduce(
    (sum, l) => sum + Number(l.wholesalePrice) * l.quantity,
    0,
  );
}

export function pickupOrderGrossProfit(
  orderTotal: number,
  lines: Array<{ quantity: number; unitWholesalePrice: string | number | null | undefined }>,
): number {
  const cost = lines.reduce((sum, line) => {
    const wholesale = line.unitWholesalePrice;
    if (wholesale == null) return sum;
    return sum + Number(wholesale) * line.quantity;
  }, 0);
  return Number((orderTotal - cost).toFixed(2));
}

export function computeBranchNetPosition(input: {
  pickupGrossProfit: number;
  allocationCost: number;
  deliveryCost: number;
}): number {
  return (
    input.pickupGrossProfit -
    input.allocationCost -
    input.deliveryCost
  );
}

/** @deprecated Use computeBranchNetPosition without payableCommission */
export function computeBranchNetPositionLegacy(input: {
  salesGmv: number;
  allocationCost: number;
  deliveryCost: number;
  payableCommission: number;
}): number {
  return (
    input.salesGmv -
    input.allocationCost -
    input.deliveryCost -
    input.payableCommission
  );
}

export function computePlatformWholesaleRevenue(
  allocationCost: number,
  deliveryCost: number,
): number {
  return allocationCost + deliveryCost;
}

export function computeCommissionLiability(
  accrued: number,
  settled: number,
): number {
  return accrued + settled;
}

export function computeInventoryCost(
  skus: Array<{ quantityOnHand: number; unitCost: string | number }>,
): number {
  return skus.reduce(
    (sum, sku) => sum + sku.quantityOnHand * Number(sku.unitCost),
    0,
  );
}

export function computeExpectedInventoryProfit(
  skus: Array<{
    quantityOnHand: number;
    unitCost: string | number;
    wholesalePrice: string | number;
  }>,
): number {
  return skus.reduce((sum, sku) => {
    const margin = Number(sku.wholesalePrice) - Number(sku.unitCost);
    return sum + sku.quantityOnHand * margin;
  }, 0);
}

export function computePlatformNetProfit(input: {
  wholesaleRevenue: number;
  cogs: number;
  distributorCommissions: number;
}): number {
  return Number(
    (input.wholesaleRevenue - input.cogs - input.distributorCommissions).toFixed(2),
  );
}
