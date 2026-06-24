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
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settlements</h1>
        <p className="text-sm text-muted-foreground">
          Commission ledger and payout export
        </p>
        <SettlementsView
          batches={batchesRes.data}
          ledgerEntries={ledgerRes.data}
          token={token}
        />
      </div>
    </AdminShellWrapper>
  );
}
