import type {
  PaginatedResponse,
  StockAdjustmentReason,
  PurchaseOrderStatus,
} from '@meridian/shared';

import { API_URL } from './api';

export type InventoryPaginated<T> = PaginatedResponse<T>;

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
    throw new Error((body as { message?: string }).message ?? 'Export failed');
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
