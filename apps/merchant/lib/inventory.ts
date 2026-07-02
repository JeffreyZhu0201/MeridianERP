import type { StockAdjustmentReason, PurchaseOrderStatus } from '@meridian/shared';

import { API_URL, type PaginatedResponse } from './api';
export type InventoryPaginated<T> = PaginatedResponse<T>;
export function emptyInventoryPage<T>(limit = 20): InventoryPaginated<T> {
  return { data: [], meta: { total: 0, page: 1, limit } };
}
export function normalizeInventoryPage<T>(
  res: InventoryPaginated<T> | null | undefined,
) {
  return {
    items: res?.data ?? [],
    total: res?.meta?.total ?? 0,
    page: res?.meta?.page ?? 1,
    limit: res?.meta?.limit ?? 20,
  };
}
export function buildInventoryQuery(
  params: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}
export async function downloadInventoryExport(
  path: string,
  token: string,
  filename: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? '导出失败');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export { StockAdjustmentReason, PurchaseOrderStatus };
