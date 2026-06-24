import { Suspense } from 'react';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type PaginatedResponse, type MerchantListItem } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { MerchantsFilters } from './_components/merchants-filters';
import { MerchantsTable } from './_components/merchants-table';

interface MerchantsPageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

export default async function MerchantsPage({ searchParams }: MerchantsPageProps) {
  const token = await getToken();
  if (!token) return null;

  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  query.set('page', params.page ?? '1');
  query.set('limit', '20');

  let merchants: MerchantListItem[] = [];
  try {
    const res = await apiFetch<PaginatedResponse<MerchantListItem>>(
      `/platform/merchants?${query.toString()}`,
      {},
      token,
    );
    merchants = res.data;
  } catch {
    merchants = [];
  }

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Merchants</h1>
        <Suspense>
          <MerchantsFilters />
        </Suspense>
        <MerchantsTable merchants={merchants} token={token} />
      </div>
    </AdminShellWrapper>
  );
}
