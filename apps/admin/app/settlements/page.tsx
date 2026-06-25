import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import {
  apiFetch,
  type CommissionLedgerEntry,
  type PaginatedResponse,
  type SettlementBatch,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import { SettlementsView } from './_components/settlements-view';

export default async function SettlementsPage() {
  const token = await getToken();
  if (!token) return null;

  const locale = await getLocale();
  const t = await getTranslations('admin.settlements');

  const formatMoney = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(value);

  const [batchesRes, ledgerRes] = await Promise.all([
    apiFetch<PaginatedResponse<SettlementBatch>>('/platform/settlements', {}, token).catch(
      () => ({ data: [], meta: { total: 0, page: 1, limit: 20 } }),
    ),
    apiFetch<PaginatedResponse<CommissionLedgerEntry>>(
      '/platform/settlements/ledger?status=ACCRUED',
      {},
      token,
    ).catch(() => ({ data: [], meta: { total: 0, page: 1, limit: 50 } })),
  ]);

  const accruedTotal = ledgerRes.data.reduce((sum, entry) => sum + Number(entry.amount), 0);

  const metrics = [
    {
      title: t('settlementBatches'),
      value: batchesRes.meta.total,
    },
    {
      title: t('accruedLedger'),
      value: ledgerRes.meta.total,
      description: t('entries', { count: ledgerRes.data.length }),
    },
    {
      title: t('accruedCommissions'),
      value: formatMoney(accruedTotal),
    },
  ];

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader metrics={metrics} />
        <ListPageFrame title={t('title')} description={t('description')}>
          <SettlementsView
            batches={batchesRes.data}
            ledgerEntries={ledgerRes.data}
            token={token}
          />
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
