/**
 * Phase 5 资金汇总相关类型定义
 * 涵盖平台和商户的资金统计报表
 */

/**
 * 平台资金汇总
 * 平台管理员查看平台整体资金状况
 * @property gmv - 商品总交易额（Gross Merchandise Value）
 * @property wholesaleRevenue - 批发收入总额（各商户采购配额的总批发价）
 * @property commissionAccrued - 累计应计佣金
 * @property commissionSettled - 累计已结算佣金
 * @property commissionLiability - 佣金负债（应计 + 已结算）
 * @property accruedAwaitingSettlement - 待结算应计佣金
 * @property pendingWithdrawals - 待处理提现申请总额
 * @property orderCount - 订单总数
 * @property deliveryOrderCount - 配送订单数量
 * @property from - 统计起始日期
 * @property to - 统计结束日期
 * @property gmvTrend - GMV 日趋势数据（可选，用于图表展示）
 */
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

/**
 * 商户资金汇总
 * 商户查看自己的资金收支状况
 * @property salesGmv - 销售总额（零售总收入）
 * @property allocationCost - 配额采购成本（向平台采购配额的批发价总额）
 * @property deliveryAllocationCost - 配送订单的配额成本
 * @property payableCommission - 应付佣金（需支付给经销商的佣金）
 * @property netPosition - 净资金位（销售 - 成本 - 配送成本 - 佣金）
 * @property from - 统计起始日期
 * @property to - 统计结束日期
 */
export interface MerchantFundsSummary {
  salesGmv: string | number;
  allocationCost: string | number;
  deliveryAllocationCost: string | number;
  payableCommission: string | number;
  netPosition: string | number;
  from: string;
  to: string;
}

/**
 * 旧版平台资金汇总（已废弃）
 * 为兼容旧版前端保留，请使用 PlatformFundsSummary
 * @deprecated Use PlatformFundsSummary fields without Last30Days suffix
 */
export type LegacyPlatformFundsSummary = {
  gmvLast30Days: string | number;
  wholesaleRevenueLast30Days: string | number;
  commissionAccruedLast30Days: string | number;
  commissionSettledLast30Days: string | number;
  pendingWithdrawals: string | number;
  orderCountLast30Days: number;
  deliveryOrderCountLast30Days: number;
};
