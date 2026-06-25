import type { BindType } from './enums.js';
import type { CommissionListResponse, CommissionSummary, PerformanceTrendPoint } from './distributors.js';

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

export interface DistributorBindingRow {
  id: string;
  bindableType: BindType;
  bindableId: string;
  boundAt: string;
}

export interface DistributorBindingsResponse {
  items: DistributorBindingRow[];
  total: number;
}

export type DistributorCommissionListResponse = CommissionListResponse;
