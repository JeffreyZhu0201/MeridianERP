import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { BentoListHeader, EmptyState, ListPageFrame } from '@meridian/ui';
import { LedgerStatus, type CommissionListQuery } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  asList,
  type Distributor,
  type OnboardingProfile,
  type PaginatedResponse,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import {
  defaultDateRange,
  fetchCommissionSummary,
  fetchCommissions,
} from '@/lib/commissions';
import { CommissionsFilters } from './_components/commissions-filters';
import { CommissionsTable } from './_components/commissions-table';

function formatMoney(value: string | number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(
    Number(value),
  );
}

interface CommissionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseQuery(
  params: Record<string, string | string[] | undefined>,
): CommissionListQuery {
  const defaults = defaultDateRange();
  const str = (key: string) => {
    const v = params[key];
    return typeof v === 'string' ? v : undefined;
  };

  const page = str('page');
  const limit = str('limit');
  const status = str('status');

  return {
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    distributorId: str('distributorId'),
    status:
      status === LedgerStatus.ACCRUED || status === LedgerStatus.SETTLED ? status : undefined,
    from: str('from') ?? defaults.from,
    to: str('to') ?? defaults.to,
  };
}

export default async function CommissionsPage({ searchParams }: CommissionsPageProps) {
  const locale = await getLocale();
  const t = await getTranslations('merchant.commissions');
  const tSummary = await getTranslations('merchant.commissions.summary');
  const token = await getToken();
  if (!token) return null;

  const rawParams = await searchParams;
  const query = parseQuery(rawParams);

  const [commissionsRes, summaryRes, profile] = await Promise.all([
    fetchCommissions(token, query).catch(() => ({
      items: [],
      total: 0,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    })),
    fetchCommissionSummary(token, {
      distributorId: query.distributorId,
      status: query.status,
      from: query.from,
      to: query.to,
    }).catch(() => ({
      accruedTotal: 0,
      settledTotal: 0,
      totalCommission: 0,
      entryCount: 0,
      from: query.from ?? defaultDateRange().from,
      to: query.to ?? defaultDateRange().to,
    })),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const isEmpty = commissionsRes.items.length === 0;

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame
        title={t('title')}
        description={t('description')}
        filters={
          <Suspense fallback={null}>
            <CommissionsFilters distributors={[]} />
          </Suspense>
        }
        emptyState={
          isEmpty ? (
            <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
          ) : undefined
        }
      >
        <div className="space-y-6">
          <BentoListHeader
            metrics={[
              { title: tSummary('accrued'), value: formatMoney(summaryRes.accruedTotal, locale) },
              { title: tSummary('settled'), value: formatMoney(summaryRes.settledTotal, locale) },
              {
                title: tSummary('totalCommission'),
                value: formatMoney(summaryRes.totalCommission, locale),
              },
              { title: tSummary('entries'), value: summaryRes.entryCount },
            ]}
          />
          <CommissionsTable items={commissionsRes.items} />
        </div>
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
