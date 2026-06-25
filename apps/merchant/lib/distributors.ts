import type { BindType, QrHistoryListQuery, QrHistoryListResponse } from '@meridian/shared';

import { API_URL, apiFetch } from './api';

export const DEFAULT_QR_EXPIRY_DAYS = 7;

export function buildQrHistoryQuery(params: QrHistoryListQuery): string {
  const search = new URLSearchParams();
  if (params.page != null) search.set('page', String(params.page));
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.bindType) search.set('bindType', params.bindType);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchQrHistory(
  distributorId: string,
  token: string,
  query: QrHistoryListQuery = {},
): Promise<QrHistoryListResponse> {
  return apiFetch<QrHistoryListResponse>(
    `/merchant/distributors/${distributorId}/qr${buildQrHistoryQuery(query)}`,
    {},
    token,
  );
}

/** Authenticated PNG download via blob (US-4.4). */
export async function downloadQrPng(
  distributorId: string,
  qrId: string,
  token: string,
  bindType: BindType,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/api/v1/merchant/distributors/${distributorId}/qr/${qrId}/download?format=png`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? 'Download failed');
  }

  const disposition = res.headers.get('Content-Disposition');
  const filenameMatch = disposition?.match(/filename="?([^";]+)"?/);
  const filename =
    filenameMatch?.[1] ?? `distributor-${distributorId.slice(0, 8)}-${bindType}-qr.png`;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
