import Link from 'next/link';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { BentoListHeader, EmptyState, ListPageFrame, buttonVariants } from '@meridian/ui/server';
import { OnboardingStatus } from '@meridian/shared';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type PaginatedResponse, type MerchantListItem, type PlatformDistributor } from '@/lib/api';
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
  let distributors: PlatformDistributor[] = [];
  try {
    const [res, distRes] = await Promise.all([
      apiFetch<PaginatedResponse<MerchantListItem>>(
        `/platform/merchants?${query.toString()}`,
        {},
        token,
      ),
      apiFetch<PlatformDistributor[]>('/platform/distributors', {}, token),
    ]);
    merchants = res.data;
    meta = res.meta;
    distributors = distRes;
  } catch {
    merchants = [];
  }

  const td = await getTranslations('admin.dashboard');
  const tc = await getTranslations('common');
  const statusFilter = params.status;
  const statusLabel =
    statusFilter && Object.values(OnboardingStatus).includes(statusFilter as OnboardingStatus)
      ? t(`onboardingStatus.${statusFilter as OnboardingStatus}`)
      : null;

  const metrics = [
    {
      title: td('totalMerchants'),
      value: meta.total,
      description: statusLabel ? `${t('filterStatus')}: ${statusLabel}` : undefined,
    },
  ];

  if (statusLabel) {
    metrics.push({
      title: statusLabel,
      value: meta.total,
      description: t('filterStatus'),
    });
  }

  metrics.push({
    title: tc('pageOf', {
      page: meta.page,
      total: Math.max(1, Math.ceil(meta.total / meta.limit)),
    }),
    value: merchants.length,
    description: undefined,
  });

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader metrics={metrics} />
        <ListPageFrame
          title={t('title')}
          description={t('description')}
          action={
            <Link href="/merchants/new" className={buttonVariants()}>
              {t('create')}
            </Link>
          }
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
          <MerchantsTable merchants={merchants} token={token} distributors={distributors} />
          <Suspense>
            <MerchantsPagination total={meta.total} page={meta.page} limit={meta.limit} />
          </Suspense>
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
