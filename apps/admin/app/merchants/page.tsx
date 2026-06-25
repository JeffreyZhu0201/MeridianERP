import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { EmptyState, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type PaginatedResponse, type MerchantListItem } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { MerchantsFilters } from './_components/merchants-filters';
import { MerchantsPagination } from './_components/merchants-pagination';
import { MerchantsTable } from './_components/merchants-table';

interface MerchantsPageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

export default async function MerchantsPage({ searchParams }: MerchantsPageProps) {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.merchants');
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  query.set('page', params.page ?? '1');
  query.set('limit', '20');

  let merchants: MerchantListItem[] = [];
  let meta = { total: 0, page: 1, limit: 20 };
  try {
    const res = await apiFetch<PaginatedResponse<MerchantListItem>>(
      `/platform/merchants?${query.toString()}`,
      {},
      token,
    );
    merchants = res.data;
    meta = res.meta;
  } catch {
    merchants = [];
  }

  return (
    <AdminShellWrapper>
      <ListPageFrame
        title={t('title')}
        description={t('description')}
        filters={
          <Suspense>
            <MerchantsFilters />
          </Suspense>
        }
        emptyState={
          merchants.length === 0 ? (
            <EmptyState title={t('empty')} description={t('emptyDescription')} />
          ) : undefined
        }
      >
        <MerchantsTable merchants={merchants} token={token} />
        <Suspense>
          <MerchantsPagination total={meta.total} page={meta.page} limit={meta.limit} />
        </Suspense>
      </ListPageFrame>
    </AdminShellWrapper>
  );
}
