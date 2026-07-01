/**
 * 资金计算公式工具函数
 * PRD Phase 5 § Fund formulas 定义的纯函数实现
 */

/**
 * 计算配额分配单的总成本
 * 将分配单中各商品行的批发价乘以数量后求和
 * @param lines - 分配单商品行列表
 * @returns 总成本金额
 */
export function sumAllocationLineCost(
  lines: Array<{ quantity: number; wholesalePrice: string | number }>,
): number {
  return lines.reduce(
    (sum, l) => sum + Number(l.wholesalePrice) * l.quantity,
    0,
  );
}

/**
 * 计算分店（商户）净资金位
 * 公式：销售GMV - 配额采购成本 - 配送成本 - 应付佣金
 * @param input - 包含各项金额的对象
 * @param input.salesGmv - 销售总额
 * @param input.allocationCost - 配额采购成本
 * @param input.deliveryCost - 配送成本
 * @param input.payableCommission - 应付佣金
 * @returns 净资金位（正值表示盈利，负值表示亏损）
 */
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

/**
 * 计算平台批发收入
 * 公式：配额采购成本 + 配送订单配额成本
 * @param allocationCost - 配额采购成本（商户向平台采购配额的批发价）
 * @param deliveryCost - 配送订单的配额成本
 * @returns 平台批发总收入
 */
export function computePlatformWholesaleRevenue(
  allocationCost: number,
  deliveryCost: number,
): number {
  return allocationCost + deliveryCost;
}

/**
 * 计算佣金负债
 * 公式：应计佣金 + 已结算佣金
 * @param accrued - 应计佣金（已记账但未结算）
 * @param settled - 已结算佣金（已支付）
 * @returns 佣金总负债
 */
export function computeCommissionLiability(
  accrued: number,
  settled: number,
): number {
  return accrued + settled;
}
