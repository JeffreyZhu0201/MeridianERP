import type { BindType, LedgerStatus } from './enums.js';

/**
 * 经销商相关类型定义
 * 涵盖绑定关系验证、佣金账本、业绩查询等功能
 */

/**
 * 绑定令牌验证成功响应
 * US-4.1 场景：门店/商户通过扫码验证绑定链接的有效性
 * @property valid - 验证结果标识（true）
 * @property distributorId - 绑定的经销商ID
 * @property distributorName - 绑定的经销商名称
 * @property bindType - 绑定类型（MERCHANT 或 CUSTOMER）
 * @property expiresAt - 令牌过期时间
 * @property requiresAuth - 认领是否需要额外认证
 * @property tenantSlug - 当 bindType 为 CUSTOMER 时，用于校验 URL slug 与令牌所属租户匹配
 */
export interface BindVerifySuccess {
  valid: true;
  distributorId: string;
  distributorName: string;
  bindType: BindType;
  expiresAt: string;
  requiresAuth: boolean;
  /** Present when bindType is CUSTOMER; used to validate URL slug matches token tenant. */
  tenantSlug?: string;
}

/**
 * 绑定令牌验证失败响应
 * @property valid - 验证结果标识（false）
 * @property error - 错误原因描述
 */
export interface BindVerifyFailure {
  valid: false;
  error: string;
}

/**
 * 绑定验证响应联合类型
 * 根据验证结果返回成功或失败结构
 */
export type BindVerifyResponse = BindVerifySuccess | BindVerifyFailure;

/**
 * 商户认领绑定请求
 * 现有商户通过绑定令牌确认与经销商的合作关系
 * @property token - 绑定令牌（从 QR 链接或邀请码获取）
 */
export interface MerchantClaimBindingRequest {
  token: string;
}

/**
 * 绑定关系记录
 * 记录经销商与商户/消费者之间的绑定关系
 * @property id - 绑定记录唯一标识
 * @property tenantId - 所属租户ID
 * @property distributorId - 经销商ID
 * @property bindableType - 被绑定方类型（MERCHANT 或 CUSTOMER）
 * @property bindableId - 被绑定方ID（商户ID或消费者ID）
 * @property boundAt - 绑定时间
 */
export interface BindingRecord {
  id: string;
  tenantId: string;
  distributorId: string;
  bindableType: BindType;
  bindableId: string;
  boundAt: string;
}

/**
 * 商店消费者认领绑定请求
 * 消费者通过 QR 码绑定到经销商（用于追踪佣金归属）
 * @property token - 绑定令牌
 */
export interface StoreClaimBindingRequest {
  token: string;
}

/**
 * 商店消费者绑定响应
 * 包含绑定记录、经销商信息和更新后的购物车信息
 * @property binding - 成功创建的绑定记录
 * @property distributor - 经销商摘要信息
 * @property cart - 更新归因后的购物车（用于后续下单追溯）
 */
export interface StoreClaimBindingResponse {
  binding: BindingRecord;
  distributor: { id: string; name: string };
  /** Cart updated with attribution for subsequent checkout. */
  cart: {
    id: string;
    distributorId: string;
  };
}

/**
 * QR 码生成请求
 * US-4.4 Slice 2：经销商生成 QR 码供商户/消费者扫码绑定
 * @property bindType - 绑定类型（可选，默认 MERCHANT）
 * @property expiresInDays - 有效期天数，范围 1-90 天（默认 7 天）
 */
export interface GenerateQrRequest {
  bindType?: BindType;
  /** 1–90 days; default 7 */
  expiresInDays?: number;
}

/**
 * QR 码生成响应
 * US-4.4：返回生成的 QR 码信息和访问 URL
 * @property id - QR 记录ID
 * @property token - 绑定令牌
 * @property url - 可访问的绑定 URL
 * @property bindType - 绑定类型
 * @property expiresAt - 过期时间
 */
export interface GenerateQrResponse {
  id: string;
  token: string;
  url: string;
  bindType: BindType;
  expiresAt: string;
}

/**
 * QR 历史记录查询参数
 * @property page - 页码
 * @property limit - 每页条数
 * @property bindType - 按绑定类型筛选
 */
export interface QrHistoryListQuery {
  page?: number;
  limit?: number;
  bindType?: BindType;
}

/**
 * QR 历史记录分页响应
 * @property items - 当前页 QR 条目列表
 * @property total - 总记录数
 * @property page - 当前页码
 * @property limit - 每页条数
 */
export interface QrHistoryListResponse {
  items: QrHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 默认佣金查询日期窗口（天数）
 * US-4.2 / US-4.3：业绩和佣金查询的默认时间范围
 */
export const DEFAULT_COMMISSION_WINDOW_DAYS = 30;

/**
 * 日期范围查询参数
 * 佣金和业绩查询的日期过滤条件
 * @property from - 起始日期（YYYY-MM-DD 或完整 ISO 8601 格式）
 * @property to - 结束日期
 */
export interface DateRangeQuery {
  from?: string;
  to?: string;
}

/**
 * 佣金对账单行
 * US-4.3：经销商查看自己的佣金明细
 * @property id - 账本记录ID
 * @property orderId - 来源订单ID
 * @property orderReference - 订单参考号（订单ID后8位，用于显示）
 * @property orderTotal - 订单总金额
 * @property distributorId - 经销商ID
 * @property distributorName - 经销商名称
 * @property commissionType - 佣金计算类型（PERCENT 或 FIXED）
 * @property commissionRate - 佣金率或固定金额
 * @property amount - 实际佣金金额
 * @property status - 账本状态（ACCRUED/SETTLED/VOID）
 * @property settlementBatchId - 结算批次ID（已结算时存在）
 * @property settlementBatchPeriod - 结算周期描述（如 "2025-06-01 — 2025-06-30"）
 * @property createdAt - 记录创建时间
 */
export interface CommissionStatementRow {
  id: string;
  orderId: string;
  /** Short display reference — last 8 chars of `orderId` (server-derived). */
  orderReference: string;
  orderTotal: string | number;
  distributorId: string;
  distributorName: string;
  commissionType: string;
  commissionRate: string | number;
  amount: string | number;
  status: LedgerStatus;
  settlementBatchId: string | null;
  /** Human-readable batch window when SETTLED, e.g. `2025-06-01 — 2025-06-30`. */
  settlementBatchPeriod: string | null;
  createdAt: string;
}

/**
 * 佣金列表查询参数
 * @property page - 页码
 * @property limit - 每页条数
 * @property distributorId - 按经销商筛选（平台管理员场景）
 * @property status - 按账本状态筛选
 */
export interface CommissionListQuery extends DateRangeQuery {
  page?: number;
  limit?: number;
  distributorId?: string;
  status?: LedgerStatus;
}

/**
 * 佣金列表分页响应
 * @property items - 佣金明细行列表
 * @property total - 总记录数
 * @property page - 当前页码
 * @property limit - 每页条数
 */
export interface CommissionListResponse {
  items: CommissionStatementRow[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 佣金汇总查询参数
 * @property distributorId - 按经销商筛选
 * @property status - 按账本状态筛选
 */
export interface CommissionSummaryQuery extends DateRangeQuery {
  distributorId?: string;
  status?: LedgerStatus;
}

/**
 * 佣金汇总数据
 * @property accruedTotal - 应计佣金总额（尚未结算）
 * @property settledTotal - 已结算佣金总额
 * @property totalCommission - 时间窗口内佣金总额（含所有状态）
 * @property entryCount - 佣金条目数量
 * @property from - 统计起始日期
 * @property to - 统计结束日期
 */
export interface CommissionSummary {
  accruedTotal: string | number;
  settledTotal: string | number;
  /** Sum of `amount` across all statuses in the filtered window. */
  totalCommission: string | number;
  entryCount: number;
  from: string;
  to: string;
}

/**
 * 经销商业绩查询参数
 * 继承自日期范围查询
 */
export interface DistributorPerformanceQuery extends DateRangeQuery {}

/**
 * 每日业绩趋势数据点
 * US-4.2：用于折线图/柱状图展示的日粒度数据
 * @property date - 日期（YYYY-MM-DD 格式）
 * @property orderCount - 当日订单数
 * @property orderRevenue - 当日订单总收入
 * @property commissionAccrued - 当日新增应计佣金
 * @property key - 允许额外字段的索引签名
 */
export interface PerformanceTrendPoint {
  date: string;
  orderCount: number;
  orderRevenue: string | number;
  commissionAccrued: string | number;
  [key: string]: string | number;
}

/**
 * 经销商业绩汇总
 * US-4.2：经销商门户首页核心 KPI 数据
 * @property distributorId - 经销商ID
 * @property distributorName - 经销商名称
 * @property bindingsMerchant - 已绑定商户数
 * @property bindingsCustomer - 已绑定消费者数
 * @property attributedOrderCount - 归因订单总数
 * @property attributedOrderRevenue - 归因订单总收入
 * @property commissionAccrued - 应计佣金总额
 * @property commissionSettled - 已结算佣金总额
 * @property commissionTotal - 佣金总合计（ACCRUED + SETTLED）
 * @property from - 统计起始日期
 * @property to - 统计结束日期
 * @property trend - 每日业绩趋势序列
 */
export interface DistributorPerformanceSummary {
  distributorId: string;
  distributorName: string;
  bindingsMerchant: number;
  bindingsCustomer: number;
  attributedOrderCount: number;
  attributedOrderRevenue: string | number;
  commissionAccrued: string | number;
  commissionSettled: string | number;
  /** ACCRUED + SETTLED in window — convenience total for KPI cards. */
  commissionTotal: string | number;
  from: string;
  to: string;
  /** Daily series for line/bar chart; empty array when no activity. */
  trend: PerformanceTrendPoint[];
}

/**
 * 平台管理后台统计数据
 * US-4.5 + Bento：平台首页仪表盘聚合数据
 * @property totalMerchants - 商户总数
 * @property pendingReview - 待审核商户数
 * @property activeDistributors - 活跃经销商数
 * @property bindingsLast30Days - 近30天新建绑定数
 * @property commissionAccruedLast30Days - 近30天新增应计佣金
 * @property commissionSettledLast30Days - 近30天已结算佣金
 * @property ordersLast30Days - 近30天订单总数
 * @property orderRevenueLast30Days - 近30天订单总收入
 * @property trend - 业绩趋势数据
 * @property recentMerchants - 最近入驻的商户列表
 */
export interface PlatformDashboardStats {
  totalMerchants: number;
  pendingReview: number;
  activeDistributors: number;
  bindingsLast30Days: number;
  commissionAccruedLast30Days: string | number;
  commissionSettledLast30Days: string | number;
  ordersLast30Days: number;
  orderRevenueLast30Days: string | number;
  trend: PerformanceTrendPoint[];
  recentMerchants: Array<{
    id: string;
    businessName: string;
    contactEmail: string;
    onboardingStatus: string;
    submittedAt?: string;
  }>;
}

/**
 * 商户关联经销商摘要
 * 在平台商户详情页显示关联的经销商信息
 * @property id - 经销商ID
 * @property name - 经销商名称
 * @property isActive - 经销商账号是否启用
 * @property bindingCount - 累计绑定关系数
 * @property bindingsLast30Days - 近30天新增绑定数
 * @property attributedOrdersLast30Days - 近30天归因订单数
 */
export interface MerchantDistributorSummary {
  id: string;
  name: string;
  isActive: boolean;
  bindingCount: number;
  bindingsLast30Days: number;
  attributedOrdersLast30Days: number;
}

/**
 * QR 令牌状态类型
 * US-4.4：根据持久化字段推导显示状态
 * - ACTIVE: 有效令牌
 * - EXPIRED: 已过期
 * - REVOKED: 已撤销
 */
export type QrTokenStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

/**
 * 根据持久化字段计算 QR 令牌显示状态
 * 优先级：撤销 > 过期 > 有效
 * @param revokedAt - 撤销时间（为 null 表示未被撤销）
 * @param expiresAt - 过期时间
 * @returns 令牌状态
 */
export function computeQrStatus(
  revokedAt: Date | string | null,
  expiresAt: Date | string,
): QrTokenStatus {
  if (revokedAt) return 'REVOKED';
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  if (expiry < new Date()) return 'EXPIRED';
  return 'ACTIVE';
}

/**
 * QR 历史记录条目
 * US-4.4：经销商查看自己生成的 QR 码历史
 * @property id - QR 记录ID
 * @property bindType - 绑定类型
 * @property createdAt - 生成时间
 * @property expiresAt - 过期时间
 * @property revokedAt - 撤销时间（null 表示未撤销）
 * @property status - 计算得出的显示状态
 * @property url - 绑定的访问 URL
 */
export interface QrHistoryEntry {
  id: string;
  bindType: BindType;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  status: QrTokenStatus;
  url: string;
}
