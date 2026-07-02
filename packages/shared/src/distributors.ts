import type { BindType, LedgerStatus } from './enums.js';

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

export interface BindVerifyFailure {
  valid: false;
  error: string;
}

export type BindVerifyResponse = BindVerifySuccess | BindVerifyFailure;

export interface MerchantClaimBindingRequest {
  token: string;
}

export interface BindingRecord {
  id: string;
  tenantId: string;
  distributorId: string;
  bindableType: BindType;
  bindableId: string;
  boundAt: string;
}

export interface StoreClaimBindingRequest {
  token: string;
}

export interface StoreClaimBindingResponse {
  binding: BindingRecord;
  distributor: { id: string; name: string };
  /** Cart updated with attribution for subsequent checkout. */
  cart: {
    id: string;
    distributorId: string;
  };
}

export interface GenerateQrRequest {
  bindType?: BindType;
  /** 1–90 days; default 7 */
  expiresInDays?: number;
}

export interface GenerateQrResponse {
  id: string;
  token: string;
  url: string;
  bindType: BindType;
  expiresAt: string;
}

export interface QrHistoryListQuery {
  page?: number;
  limit?: number;
  bindType?: BindType;
}

export interface QrHistoryListResponse {
  items: QrHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

export const DEFAULT_COMMISSION_WINDOW_DAYS = 30;

export interface DateRangeQuery {
  from?: string;
  to?: string;
}

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

export interface CommissionListQuery extends DateRangeQuery {
  page?: number;
  limit?: number;
  distributorId?: string;
  status?: LedgerStatus;
}

export interface CommissionListResponse {
  items: CommissionStatementRow[];
  total: number;
  page: number;
  limit: number;
}

export interface CommissionSummaryQuery extends DateRangeQuery {
  distributorId?: string;
  status?: LedgerStatus;
}

export interface CommissionSummary {
  accruedTotal: string | number;
  settledTotal: string | number;
  /** Sum of `amount` across all statuses in the filtered window. */
  totalCommission: string | number;
  entryCount: number;
  from: string;
  to: string;
}

export interface DistributorPerformanceQuery extends DateRangeQuery {}

export interface PerformanceTrendPoint {
  date: string;
  orderCount: number;
  orderRevenue: string | number;
  commissionAccrued: string | number;
  [key: string]: string | number;
}

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

export interface MerchantDistributorSummary {
  id: string;
  name: string;
  isActive: boolean;
  bindingCount: number;
  bindingsLast30Days: number;
  attributedOrdersLast30Days: number;
}

export type QrTokenStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export function computeQrStatus(
  revokedAt: Date | string | null,
  expiresAt: Date | string,
): QrTokenStatus {
  if (revokedAt) return 'REVOKED';
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  if (expiry < new Date()) return 'EXPIRED';
  return 'ACTIVE';
}

export interface QrHistoryEntry {
  id: string;
  bindType: BindType;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  status: QrTokenStatus;
  url: string;
}
