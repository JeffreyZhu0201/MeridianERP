'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  Button,
  EmptyState,
  formatMoney,
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

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SettlementsView({ batches, ledgerEntries, token }: SettlementsViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin.settlements');
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
      setError(err instanceof Error ? err.message : t('exportFailed'));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-end gap-4">
        <Button onClick={handleExport} disabled={exporting || ledgerEntries.length === 0}>
          {exporting ? t('exporting') : t('export')}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="space-y-3">
        <h2 className="text-lg font-medium">{t('settlementBatches')}</h2>
        {batches.length === 0 ? (
          <EmptyState title={t('emptyBatches')} />
        ) : (
          <div className="rounded-xl ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columns.period')}</TableHead>
                  <TableHead>{t('columns.status')}</TableHead>
                  <TableHead>{t('columns.entries')}</TableHead>
                  <TableHead>{t('columns.exported')}</TableHead>
                  <TableHead>{t('columns.created')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      {formatDate(batch.periodStart, locale)} — {formatDate(batch.periodEnd, locale)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={batch.status === 'EXPORTED' ? 'default' : 'secondary'}>
                        {batch.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{batch._count?.entries ?? 0}</TableCell>
                    <TableCell>
                      {batch.exportedAt ? formatDate(batch.exportedAt, locale) : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(batch.createdAt, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">{t('accruedLedger')}</h2>
        {ledgerEntries.length === 0 ? (
          <EmptyState title={t('emptyLedger')} />
        ) : (
          <div className="rounded-xl ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columns.merchant')}</TableHead>
                  <TableHead>{t('columns.distributor')}</TableHead>
                  <TableHead>{t('columns.order')}</TableHead>
                  <TableHead className="text-right">{t('columns.commission')}</TableHead>
                  <TableHead>{t('columns.date')}</TableHead>
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
                    <TableCell className="text-right">{formatMoney(entry.amount, 'USD', locale)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(entry.createdAt, locale)}
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
