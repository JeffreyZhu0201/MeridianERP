import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame, formatMoney } from '@meridian/ui/server';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import {
  apiFetch,
  type CommissionLedgerEntry,
  type PaginatedResponse,
  type SettlementBatch,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import { SettlementsView } from './_components/settlements-view';

type LedgerStatusFilter = 'ACCRUED' | 'SETTLED' | 'ALL';

function parseLedgerStatus(value?: string): LedgerStatusFilter {
  if (value === 'SETTLED' || value === 'ALL') return value;
  return 'ACCRUED';
}

export default async function SettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    ledgerPage?: string;
    ledgerStatus?: string;
  }>;
}) {
  const token = await getToken();
  if (!token) return null;

  const params = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations('admin.settlements');

  const batchPage = Math.max(1, Number(params.page ?? '1') || 1);
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

  const [batchesRes, ledgerRes] = await Promise.all([
    apiFetch<PaginatedResponse<SettlementBatch>>(
      `/platform/settlements?${batchQuery.toString()}`,
      {},
      token,
    ).catch(() => ({ data: [], meta: { total: 0, page: batchPage, limit: 20 } })),
    apiFetch<PaginatedResponse<CommissionLedgerEntry>>(
      `/platform/settlements/ledger?${ledgerQuery.toString()}`,
      {},
      token,
    ).catch(() => ({ data: [], meta: { total: 0, page: ledgerPage, limit: 50 } })),
  ]);

  const accruedTotal =
    ledgerStatus === 'ACCRUED'
      ? ledgerRes.data.reduce((sum, entry) => sum + Number(entry.amount), 0)
      : 0;

  const ledgerTitleKey =
    ledgerStatus === 'SETTLED'
      ? 'settledLedger'
      : ledgerStatus === 'ALL'
        ? 'commissionLedger'
        : 'accruedLedger';

  const metrics = [
    {
      title: t('settlementBatches'),
      value: batchesRes.meta.total,
    },
    {
      title: t(ledgerTitleKey),
      value: ledgerRes.meta.total,
      description: t('entries', { count: ledgerRes.data.length }),
    },
    ...(ledgerStatus === 'ACCRUED'
      ? [
          {
            title: t('accruedCommissions'),
            value: formatMoney(accruedTotal, 'USD', locale),
          },
        ]
      : []),
  ];

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader metrics={metrics} />
        <ListPageFrame title={t('title')} description={t('description')}>
          <SettlementsView
            batches={batchesRes.data}
            batchMeta={batchesRes.meta}
            ledgerEntries={ledgerRes.data}
            ledgerMeta={ledgerRes.meta}
            ledgerStatus={ledgerStatus}
            token={token}
          />
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
