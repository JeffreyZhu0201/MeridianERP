import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui';

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

  const t = await getTranslations('admin.settlements');

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

  return (
    <AdminShellWrapper>
      <ListPageFrame title={t('title')} description={t('description')}>
        <SettlementsView
          batches={batchesRes.data}
          ledgerEntries={ledgerRes.data}
          token={token}
        />
      </ListPageFrame>
    </AdminShellWrapper>
  );
}
