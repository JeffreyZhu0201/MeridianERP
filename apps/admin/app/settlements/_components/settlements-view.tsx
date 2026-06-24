'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';

import { apiFetch, type CommissionLedgerEntry, type SettlementBatch } from '@/lib/api';

interface SettlementsViewProps {
  batches: SettlementBatch[];
  ledgerEntries: CommissionLedgerEntry[];
  token: string;
}

function formatPrice(price: string | number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(price),
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SettlementsView({ batches, ledgerEntries, token }: SettlementsViewProps) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  async function handleExport() {
    setExporting(true);
    setError('');
    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const periodEnd = now.toISOString();

      await apiFetch(
        '/platform/settlements/export',
        {
          method: 'POST',
          body: JSON.stringify({ periodStart, periodEnd }),
        },
        token,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  const accruedTotal = ledgerEntries.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Accrued commissions</p>
          <p className="text-2xl font-semibold">{formatPrice(accruedTotal)}</p>
          <p className="text-xs text-muted-foreground">{ledgerEntries.length} entries</p>
        </div>
        <Button onClick={handleExport} disabled={exporting || ledgerEntries.length === 0}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Settlement batches</h2>
        {batches.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-muted-foreground">No settlement batches yet</p>
          </div>
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Exported</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      {formatDate(batch.periodStart)} — {formatDate(batch.periodEnd)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={batch.status === 'EXPORTED' ? 'default' : 'secondary'}>
                        {batch.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{batch._count?.entries ?? 0}</TableCell>
                    <TableCell>
                      {batch.exportedAt ? formatDate(batch.exportedAt) : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(batch.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Accrued ledger</h2>
        {ledgerEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-muted-foreground">No accrued commissions</p>
          </div>
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Distributor</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.tenant.slug}</TableCell>
                    <TableCell>{entry.distributor.name}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {entry.order.id.slice(0, 8)}…
                    </TableCell>
                    <TableCell className="text-right">{formatPrice(entry.amount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
