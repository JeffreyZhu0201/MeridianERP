import { ApiError, asList, asListTotal } from '@meridian/shared';

export { ApiError, asList, asListTotal };

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
export const AUTH_COOKIE = 'merchant_token';

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

export interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string; role: string };
}

export interface OnboardingProfile {
  businessName: string;
  legalName?: string;
  contactEmail: string;
  contactPhone?: string;
  onboardingStatus: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  companyId?: string;
  company?: { name: string };
}

export type { CrmStoreCustomerListItem, MerchantSession } from '@meridian/shared';

export interface Company {
  id: string;
  name: string;
  website?: string;
  _count?: { contacts: number };
}

export interface Lead {
  id: string;
  title: string;
  stage: string;
  source?: string;
  contact?: { id: string; firstName: string; lastName: string };
  updatedAt: string;
}

export interface MerchantDashboard {
  businessName: string;
  contactsCount: number;
  openLeads: number;
  recentLeads: Lead[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  parent?: { name: string };
  _count?: { products: number };
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: string | number;
  inventory: number;
  isActive: boolean;
  masterSkuId?: string | null;
  masterSku?: { retailPrice: string | number } | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPublished: boolean;
  categoryId?: string;
  category?: { id: string; name: string };
  variants: ProductVariant[];
}
