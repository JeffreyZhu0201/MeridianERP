import type {
  AdminPermission,
  AdminPlatformRole,
  DistributorBranchAllocationSummary,
  DistributorBranchSummary,
  MasterSkuImageInput,
  MasterSkuSummary,
  MediaAssetSummary,
  MerchantRecruitInviteCodeResponse,
  PlatformAccountDetail,
  PlatformAccountListItem,
  PlatformDashboardStats,
  PlatformDistributorSummary,
  PlatformFundsSummary,
  PlatformMerchantDetail,
  PlatformMerchantStatistics,
  PlatformRecentMerchant,
  UpdatePlatformAccountIdentitiesRequest,
  UpdatePlatformAccountRequest,
} from '@meridian/shared';
import { ApiError } from '@meridian/shared';

export { ApiError };

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
export const AUTH_COOKIE = 'admin_token';
export const ADMIN_ROLE_COOKIE = 'admin_role';

export interface AdminSession {
  id: string;
  email: string;
  role: AdminPlatformRole;
  permissions: AdminPermission[];
  homePath: string;
}

export interface PlatformAdmin {
  id: string;
  email: string;
  role: AdminPlatformRole;
  createdAt: string;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? res.statusText);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function apiUploadForm<T>(
  path: string,
  formData: FormData,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method: 'POST',
    headers,
    body: formData,
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

export type MerchantListItem = PlatformRecentMerchant;
export type MerchantDetail = PlatformMerchantDetail;
export type MerchantStatistics = PlatformMerchantStatistics;
export type DashboardStats = PlatformDashboardStats;

export interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string; role: AdminPlatformRole };
  homePath?: string;
}

export interface PlatformOrder {
  id: string;
  tenantId?: string;
  status: string;
  fulfillmentType?: string;
  total: string | number;
  currency: string;
  guestEmail?: string;
  createdAt: string;
  tenant: { id: string; slug: string; businessName?: string };
  distributor?: { id: string; name: string } | null;
}

export type PlatformDistributor = PlatformDistributorSummary;
export type DistributorBranch = DistributorBranchSummary;
export type { DistributorBranchAllocationSummary };
export type MasterSku = MasterSkuSummary;
export type { MasterSkuImageInput, MediaAssetSummary };
export type FundsSummary = PlatformFundsSummary;
export type RecruitInviteCode = MerchantRecruitInviteCodeResponse;
export type {
  PlatformAccountDetail,
  PlatformAccountListItem,
  UpdatePlatformAccountIdentitiesRequest,
  UpdatePlatformAccountRequest,
};

/** Approved merchant row for staff assignment (list API includes tenantId). */
export interface ApprovedMerchantOption {
  id: string;
  tenantId: string;
  businessName: string;
}

export interface AllocationOrderLine {
  id: string;
  masterSkuId: string;
  quantity: number;
  wholesalePrice: string | number;
  masterSku?: { skuCode: string; name: string };
}

export interface AllocationOrder {
  id: string;
  tenantId: string;
  status: string;
  note?: string | null;
  issuedAt?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
  tenant?: { merchantProfile?: { businessName: string } };
  lines: AllocationOrderLine[];
}

export interface WithdrawalRequest {
  id: string;
  distributorId: string;
  amount: string | number;
  status: string;
  note?: string | null;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  distributor: { name: string; email?: string | null };
}

export interface CommissionLedgerEntry {
  id: string;
  amount: string | number;
  status: string;
  createdAt: string;
  distributor: { id: string; name: string };
  order: { id: string; total: string | number };
  tenant: { id: string; slug: string };
}

export interface SettlementBatch {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  exportedAt?: string;
  createdAt: string;
  _count?: { entries: number };
}
