export function sumAllocationLineCost(
  lines: Array<{ quantity: number; wholesalePrice: string | number }>,
): number {
  return lines.reduce(
    (sum, l) => sum + Number(l.wholesalePrice) * l.quantity,
    0,
  );
}

export function computeBranchNetPosition(input: {
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
