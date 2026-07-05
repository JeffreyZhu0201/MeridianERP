import {
  DEFAULT_COMMISSION_WINDOW_DAYS,
  type CommissionListQuery,
  type CommissionListResponse,
  type CommissionSummary,
  type CommissionSummaryQuery,
} from '@meridian/shared';

import { apiFetch } from './api';

export function formatDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function defaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - DEFAULT_COMMISSION_WINDOW_DAYS);
  return { from: formatDateParam(from), to: formatDateParam(to) };
}

export function dateRangeForPreset(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - days);
  return { from: formatDateParam(from), to: formatDateParam(to) };
}

function appendDateRangeQuery(
  search: URLSearchParams,
  query: { from?: string; to?: string },
): void {
  if (query.from) search.set('from', query.from);
  if (query.to) search.set('to', query.to);
}

export function buildCommissionListQuery(params: CommissionListQuery = {}): string {
  const search = new URLSearchParams();
  if (params.page != null) search.set('page', String(params.page));
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.distributorId) search.set('distributorId', params.distributorId);
  if (params.status) search.set('status', params.status);
  appendDateRangeQuery(search, params);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function buildCommissionSummaryQuery(params: CommissionSummaryQuery = {}): string {
  const search = new URLSearchParams();
  if (params.distributorId) search.set('distributorId', params.distributorId);
  if (params.status) search.set('status', params.status);
  appendDateRangeQuery(search, params);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchCommissions(
  token: string,
  query: CommissionListQuery = {},
): Promise<CommissionListResponse> {
  const range = defaultDateRange();
  return apiFetch<CommissionListResponse>(
    `/merchant/commissions${buildCommissionListQuery({
      ...range,
      ...query,
    })}`,
    {},
    token,
  );
}

export async function fetchCommissionSummary(
  token: string,
  query: CommissionSummaryQuery = {},
): Promise<CommissionSummary> {
  const range = defaultDateRange();
  return apiFetch<CommissionSummary>(
    `/merchant/commissions/summary${buildCommissionSummaryQuery({
      ...range,
      ...query,
    })}`,
    {},
    token,
  );
}
