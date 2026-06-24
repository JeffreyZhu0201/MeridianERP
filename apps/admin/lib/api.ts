export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
export const AUTH_COOKIE = 'admin_token';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
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

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export interface MerchantListItem {
  id: string;
  businessName: string;
  contactEmail: string;
  onboardingStatus: string;
  submittedAt?: string;
}

export interface MerchantDetail extends MerchantListItem {
  legalName?: string;
  contactPhone?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  tenantId?: string;
  crmSummary?: {
    contacts: number;
    companies: number;
    leads: number;
  };
  distributors?: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
}

export interface DashboardStats {
  totalMerchants: number;
  pendingReview: number;
  activeDistributors: number;
  bindingsLast30Days: number;
  recentMerchants: MerchantListItem[];
}

export interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string; role: string };
}

export interface PlatformOrder {
  id: string;
  status: string;
  total: string | number;
  currency: string;
  guestEmail?: string;
  createdAt: string;
  tenant: { id: string; slug: string; businessName?: string };
  distributor?: { name: string };
}

export interface CommissionLedgerEntry {
  id: string;
  amount: string | number;
  status: string;
  createdAt: string;
  distributor: { name: string };
  order: { id: string; total: string | number };
  tenant: { slug: string };
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
