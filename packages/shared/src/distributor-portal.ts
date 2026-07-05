import type { CommissionListResponse, CommissionSummary, PerformanceTrendPoint } from './distributors.js';

/**
 * 经销商登录请求
 * @property email - 经销商邮箱（必填）
 * @property password - 登录密码（必填）
 * @property tenantSlug - 当同一邮箱在多个商户下存在时，指定登录的商户域
 */
export interface DistributorLoginRequest {
  email: string;
  password: string;
  /** Scope login when the same email exists under multiple merchants. */
  tenantSlug?: string;
}

export interface DistributorLoginResponse {
  accessToken: string;
  distributor: {
    id: string;
    name: string;
    email: string;
    tenantSlug: string;
  };
}

export interface EnableDistributorPortalRequest {
  password: string;
}

export interface EnableDistributorPortalResponse {
  id: string;
  portalEnabled: boolean;
  email: string | null;
}

export interface DistributorDashboard {
  distributorId: string;
  distributorName: string;
  branchCount: number;
  attributedOrderCount: number;
  attributedOrderRevenue: string | number;
  availableBalance: string | number;
  commissionSummary: CommissionSummary;
  trend: PerformanceTrendPoint[];
}

export type DistributorCommissionListResponse = CommissionListResponse;
