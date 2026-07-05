import type { LedgerStatus } from './enums.js';

export const DEFAULT_COMMISSION_WINDOW_DAYS = 30;

export interface DateRangeQuery {
  from?: string;
  to?: string;
}

export interface CommissionStatementRow {
  id: string;
  orderId?: string | null;
  allocationOrderId?: string | null;
  /** Short display reference — last 8 chars of source id (server-derived). */
  orderReference: string;
  orderTotal: string | number;
  businessName?: string | null;
  distributorId: string;
  distributorName: string;
  commissionType: string;
  commissionRate: string | number;
  amount: string | number;
  status: LedgerStatus;
  customerOrderSequence?: number | null;
  merchantAllocationSequence?: number | null;
  commissionSource?: string | null;
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
