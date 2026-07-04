'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  Button,
  EmptyState,
  formatMoney,
  Input,
  Label,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ListPagination,
} from '@meridian/ui';
import { apiFetch, type CommissionLedgerEntry, type SettlementBatch } from '@/lib/api';

type LedgerStatusFilter = 'ACCRUED' | 'SETTLED' | 'ALL';

interface SettlementsViewProps {
  batches: SettlementBatch[];
  batchMeta: { total: number; page: number; limit: number };
  ledgerEntries: CommissionLedgerEntry[];
  ledgerMeta: { total: number; page: number; limit: number };
  ledgerStatus: LedgerStatusFilter;
  token: string;
}

const LEDGER_STATUSES: LedgerStatusFilter[] = ['ACCRUED', 'SETTLED', 'ALL'];

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function currentMonthValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

function exportPeriodForMonth(monthValue: string): { periodStart: string; periodEnd: string } {
  const [year, month] = monthValue.split('-').map(Number);
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);
  return { periodStart: periodStart.toISOString(), periodEnd: periodEnd.toISOString() };
}

function exportPeriodLast30Days(): { periodStart: string; periodEnd: string } {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 30);
  return { periodStart: periodStart.toISOString(), periodEnd: periodEnd.toISOString() };
}

export function SettlementsView({
  batches,
  batchMeta,
  ledgerEntries,
  ledgerMeta,
  ledgerStatus,
  token,
}: SettlementsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('admin.settlements');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [exportMode, setExportMode] = useState<'month' | 'last30'>('month');
  const [exportMonth, setExportMonth] = useState(currentMonthValue);

  const ledgerTotalPages = Math.max(1, Math.ceil(ledgerMeta.total / ledgerMeta.limit));

  const ledgerTitleKey =
    ledgerStatus === 'SETTLED'
      ? 'settledLedger'
      : ledgerStatus === 'ALL'
        ? 'commissionLedger'
        : 'accruedLedger';

  const emptyLedgerKey =
    ledgerStatus === 'SETTLED'
      ? 'emptySettledLedger'
      : ledgerStatus === 'ALL'
        ? 'emptyCommissionLedger'
        : 'emptyLedger';

  function updateLedgerStatus(value: LedgerStatusFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'ACCRUED') {
      params.delete('ledgerStatus');
    } else {
      params.set('ledgerStatus', value);
    }
    params.delete('ledgerPage');
    router.push(`/settlements?${params.toString()}`);
  }

  async function handleExport() {
    setExporting(true);
    setError('');
    try {
      const { periodStart, periodEnd } =
        exportMode === 'last30' ? exportPeriodLast30Days() : exportPeriodForMonth(exportMonth);

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
      <div className="flex flex-wrap items-end justify-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="export-mode">{t('exportPeriod')}</Label>
          <Select
            id="export-mode"
            value={exportMode}
            onChange={(e) => setExportMode(e.target.value as 'month' | 'last30')}
            className="min-w-[160px]"
          >
            <option value="month">{t('exportByMonth')}</option>
            <option value="last30">{t('exportLast30Days')}</option>
          </Select>
        </div>
        {exportMode === 'month' ? (
          <div className="space-y-2">
            <Label htmlFor="export-month">{t('exportMonth')}</Label>
            <Input
              id="export-month"
              type="month"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="w-40"
            />
          </div>
        ) : null}
        <Button onClick={handleExport} disabled={exporting}>
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
                        {t(`batchStatus.${batch.status as 'DRAFT' | 'EXPORTED' | 'PAID'}`)}
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
        <Suspense>
          <ListPagination
            basePath="/settlements"
            total={batchMeta.total}
            page={batchMeta.page}
            limit={batchMeta.limit}
            summary={t('batchPagination', {
              page: batchMeta.page,
              totalPages: Math.max(1, Math.ceil(batchMeta.total / batchMeta.limit)),
              total: batchMeta.total,
            })}
          />
        </Suspense>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-lg font-medium">{t(ledgerTitleKey)}</h2>
          <div className="space-y-2">
            <Label htmlFor="ledger-status-filter">{t('ledgerStatusFilter')}</Label>
            <Select
              id="ledger-status-filter"
              value={ledgerStatus}
              onChange={(e) => updateLedgerStatus(e.target.value as LedgerStatusFilter)}
              className="min-w-[160px]"
            >
              {LEDGER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`ledgerStatus.${status}`)}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {ledgerEntries.length === 0 ? (
          <EmptyState title={t(emptyLedgerKey)} />
        ) : (
          <div className="rounded-xl ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columns.merchant')}</TableHead>
                  <TableHead>{t('columns.distributor')}</TableHead>
                  <TableHead>{t('columns.order')}</TableHead>
                  {ledgerStatus === 'ALL' ? (
                    <TableHead>{t('columns.status')}</TableHead>
                  ) : null}
                  <TableHead className="text-right">{t('columns.commission')}</TableHead>
                  <TableHead>{t('columns.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Link
                        href={`/merchants?search=${encodeURIComponent(entry.tenant.slug)}`}
                        className="text-primary hover:underline"
                      >
                        {entry.tenant.slug}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/distributors/${entry.distributor.id}`}
                        className="text-primary hover:underline"
                      >
                        {entry.distributor.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={`/orders/${entry.order.id}`}
                        className="text-primary hover:underline"
                      >
                        {entry.order.id.slice(0, 8)}…
                      </Link>
                    </TableCell>
                    {ledgerStatus === 'ALL' ? (
                      <TableCell>
                        <Badge variant={entry.status === 'SETTLED' ? 'default' : 'secondary'}>
                          {t(`ledgerStatus.${entry.status as 'ACCRUED' | 'SETTLED'}`)}
                        </Badge>
                      </TableCell>
                    ) : null}
                    <TableCell className="text-right">
                      {formatMoney(entry.amount, 'USD', locale)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(entry.createdAt, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <Suspense>
          <ListPagination
            basePath="/settlements"
            total={ledgerMeta.total}
            page={ledgerMeta.page}
            limit={ledgerMeta.limit}
            pageParam="ledgerPage"
            summary={t('ledgerPagination', {
              page: ledgerMeta.page,
              totalPages: ledgerTotalPages,
              total: ledgerMeta.total,
            })}
          />
        </Suspense>
      </div>
    </div>
  );
}
