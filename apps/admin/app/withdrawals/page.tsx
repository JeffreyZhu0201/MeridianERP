import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, EmptyState, formatMoney, ListPageFrame } from '@meridian/ui/server';
import type { PaginatedWithdrawalList, WithdrawalRequestRow } from '@meridian/shared';
import { adminRoleHasPermission } from '@meridian/shared';

import { ListPagination } from '@meridian/ui';
import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import {
  apiFetch,
  type CommissionLedgerEntry,
  type PaginatedResponse,
  type PlatformDistributor,
  type SettlementBatch,
} from '@/lib/api';
import { requireAdminSession, requireToken } from '@/lib/auth';
import { SettlementsPanel } from './_components/settlements-panel';
import { WithdrawalsTable } from './_components/withdrawals-table';
import { WithdrawalsToolbar } from './_components/withdrawals-toolbar';
import { WithdrawalsWorkflowHint } from './_components/withdrawals-workflow-hint';
import { WithdrawalsWorkflowNav } from './_components/withdrawals-workflow-nav';

const CURRENCY = 'CNY';

type LedgerStatusFilter = 'ACCRUED' | 'SETTLED' | 'ALL';

function parseLedgerStatus(value?: string): LedgerStatusFilter {
  if (value === 'SETTLED' || value === 'ALL') return value;
  return 'ACCRUED';
}

function legacyTabRedirect(params: Record<string, string | undefined>): string | null {
  if (params.tab !== 'settlements') return null;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value || key === 'tab') continue;
    if (key === 'page') {
      query.set('batchPage', value);
    } else {
      query.set(key, value);
    }
  }
  const qs = query.toString();
  return qs ? `/withdrawals?${qs}#settlements` : '/withdrawals#settlements';
}

export default async function WithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    status?: string;
    distributorId?: string;
    page?: string;
    batchPage?: string;
    ledgerPage?: string;
    ledgerStatus?: string;
  }>;
}) {
  const [token, session] = await Promise.all([requireToken(), requireAdminSession()]);
  const params = await searchParams;

  const legacyTarget = legacyTabRedirect(params);
  if (legacyTarget) {
    redirect(legacyTarget);
  }

  const canSettle =
    session.permissions?.includes('settlements') ||
    adminRoleHasPermission(session.role, 'settlements');

  const locale = await getLocale();
  const t = await getTranslations('admin.withdrawals');
  const ts = await getTranslations('admin.settlements');
  const tc = await getTranslations('common');

  const status = params.status ?? 'PENDING';
  const withdrawalQuery = new URLSearchParams();
  if (status && status !== 'ALL') withdrawalQuery.set('status', status);
  if (params.distributorId) withdrawalQuery.set('distributorId', params.distributorId);
  withdrawalQuery.set('page', params.page ?? '1');
  withdrawalQuery.set('limit', '20');

  const batchPage = Math.max(1, Number(params.batchPage ?? '1') || 1);
  const ledgerPage = Math.max(1, Number(params.ledgerPage ?? '1') || 1);
  const ledgerStatus = parseLedgerStatus(params.ledgerStatus);

  const batchQuery = new URLSearchParams({
    page: String(batchPage),
    limit: '20',
  });
  const ledgerQuery = new URLSearchParams({
    page: String(ledgerPage),
    limit: '50',
  });
  if (ledgerStatus !== 'ALL') {
    ledgerQuery.set('status', ledgerStatus);
  }

  let withdrawals: WithdrawalRequestRow[] = [];
  let meta = { total: 0, page: 1, limit: 20 };
  let distributors: PlatformDistributor[] = [];
  let pendingCount = 0;
  let pendingTotal = 0;
  let accruedCount = 0;
  let accruedTotal = 0;
  let batches: SettlementBatch[] = [];
  let batchMeta = { total: 0, page: batchPage, limit: 20 };
  let ledgerEntries: CommissionLedgerEntry[] = [];
  let ledgerMeta = { total: 0, page: ledgerPage, limit: 50 };

  try {
    const fetches: Promise<unknown>[] = [
      apiFetch<PaginatedWithdrawalList>(
        `/platform/withdrawals?${withdrawalQuery.toString()}`,
        {},
        token,
      ),
      apiFetch<PlatformDistributor[]>('/platform/distributors', {}, token),
      apiFetch<PaginatedWithdrawalList>(
        '/platform/withdrawals?status=PENDING&page=1&limit=500',
        {},
        token,
      ),
    ];
    if (canSettle) {
      fetches.push(
        apiFetch<PaginatedResponse<CommissionLedgerEntry>>(
          '/platform/settlements/ledger?status=ACCRUED&page=1&limit=500',
          {},
          token,
        ),
        apiFetch<PaginatedResponse<SettlementBatch>>(
          `/platform/settlements?${batchQuery.toString()}`,
          {},
          token,
        ),
        apiFetch<PaginatedResponse<CommissionLedgerEntry>>(
          `/platform/settlements/ledger?${ledgerQuery.toString()}`,
          {},
          token,
        ),
      );
    }

    const results = await Promise.all(fetches);
    const withdrawalsRes = results[0] as PaginatedWithdrawalList;
    const distributorsRes = results[1] as PlatformDistributor[];
    const pendingRes = results[2] as PaginatedWithdrawalList;

    withdrawals = withdrawalsRes.data;
    meta = withdrawalsRes.meta;
    distributors = distributorsRes;
    pendingCount = pendingRes.meta.total;
    pendingTotal = pendingRes.data.reduce((sum, w) => sum + Number(w.amount), 0);

    if (canSettle) {
      const accruedRes = results[3] as PaginatedResponse<CommissionLedgerEntry>;
      const batchesRes = results[4] as PaginatedResponse<SettlementBatch>;
      const ledgerRes = results[5] as PaginatedResponse<CommissionLedgerEntry>;
      accruedCount = accruedRes.meta.total;
      accruedTotal = accruedRes.data.reduce((sum, entry) => sum + Number(entry.amount), 0);
      batches = batchesRes.data;
      batchMeta = batchesRes.meta;
      ledgerEntries = ledgerRes.data;
      ledgerMeta = ledgerRes.meta;
    }
  } catch {
    withdrawals = [];
  }

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  const headerMetrics = canSettle
    ? [
        {
          title: ts('accruedCommissions'),
          value: formatMoney(accruedTotal, CURRENCY, locale),
          description: ts('entries', { count: accruedCount }),
        },
        { title: ts('settlementBatches'), value: batchMeta.total },
        {
          title: t('tabs.pending'),
          value: pendingCount,
        },
        {
          title: t('columns.amount'),
          value: formatMoney(pendingTotal, CURRENCY, locale),
        },
      ]
    : [
        {
          title: t('tabs.pending'),
          value: pendingCount,
          description:
            status === 'PENDING'
              ? undefined
              : t('pagination', { page: meta.page, totalPages, total: meta.total }),
        },
        {
          title: t('columns.amount'),
          value: formatMoney(pendingTotal, CURRENCY, locale),
          description: t('approvalSectionDescription'),
        },
        {
          title: tc('pageOf', { page: meta.page, total: totalPages }),
          value: withdrawals.length,
        },
      ];

  return (
    <AdminShellWithSession session={session}>
      <div className="space-y-6">
        <BentoListHeader metrics={headerMetrics} />
        <Suspense fallback={null}>
          <WithdrawalsWorkflowNav showSettlements={canSettle} />
        </Suspense>
        <WithdrawalsWorkflowHint
          pendingCount={pendingCount}
          showSettlements={canSettle}
          accruedCount={accruedCount}
          accruedTotalFormatted={
            canSettle ? formatMoney(accruedTotal, CURRENCY, locale) : undefined
          }
        />

        {canSettle ? (
          <section id="settlements" className="scroll-mt-24 space-y-4">
            <ListPageFrame
              title={t('mainTabs.settlements')}
              description={t('settlementsSectionDescription')}
            >
              <SettlementsPanel
                batches={batches}
                batchMeta={batchMeta}
                ledgerEntries={ledgerEntries}
                ledgerMeta={ledgerMeta}
                ledgerStatus={ledgerStatus}
                token={token}
              />
            </ListPageFrame>
          </section>
        ) : null}

        <section id="approval" className="scroll-mt-24 space-y-4">
          <Suspense fallback={null}>
            <WithdrawalsToolbar distributors={distributors} />
          </Suspense>
          <ListPageFrame
            title={t('mainTabs.approval')}
            description={t('approvalSectionDescription')}
            emptyState={
              withdrawals.length === 0 ? <EmptyState title={t('empty')} /> : undefined
            }
          >
            <WithdrawalsTable withdrawals={withdrawals} token={token} />
            <Suspense>
              <ListPagination
                basePath="/withdrawals"
                total={meta.total}
                page={meta.page}
                limit={meta.limit}
                summary={t('pagination', { page: meta.page, totalPages, total: meta.total })}
              />
            </Suspense>
          </ListPageFrame>
        </section>
      </div>
    </AdminShellWithSession>
  );
}
