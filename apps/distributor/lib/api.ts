/*
 * @Author: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @Date: 2026-07-02 22:39:41
 * @LastEditors: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @LastEditTime: 2026-07-04 00:18:52
 * @FilePath: /MeridianERP/apps/distributor/lib/api.ts
 * @Description: Distributor API
 * 
 * Copyright (c) 2026 by JeffreyZhu, All Rights Reserved. 
 */
import { ApiError } from '@meridian/shared';

export { ApiError };

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
export const AUTH_COOKIE = 'distributor_token';

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

  return res.json() as Promise<T>;
}

export type {
  DistributorLoginResponse,
  DistributorDashboard,
  DistributorCommissionListResponse,
  DistributorBindingsResponse,
  DistributorBranchSummary,
  WithdrawalRequestRow,
} from '@meridian/shared';
