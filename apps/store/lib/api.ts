export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
export const STORE_APP_URL = process.env.STORE_APP_URL ?? 'http://localhost:3003';
export const AUTH_COOKIE = 'store_token';

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

export function storePath(slug: string, path = ''): string {
  if (!path) return `/store/${slug}`;
  return `/store/${slug}${path.startsWith('/') ? path : `/${path}`}`;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export interface AuthResponse {
  accessToken: string;
  customer: { id: string; email: string };
}

export interface StoreInfo {
  slug: string;
  businessName: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: string | number;
  inventory: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPublished: boolean;
  variants: ProductVariant[];
  category?: { id: string; name: string };
}

export interface CartItem {
  id: string;
  quantity: number;
  variant: {
    id: string;
    name: string;
    price: string | number;
    product: { name: string; slug: string };
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: string | number;
}

export interface BindVerifyResponse {
  valid: boolean;
  distributorName?: string;
  requiresAuth?: boolean;
  expired?: boolean;
  error?: string;
}
