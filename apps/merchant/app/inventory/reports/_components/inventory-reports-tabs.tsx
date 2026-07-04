'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Button,
  Input,
  Label,
  MetricCard,
  StockAdjustmentReasonBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import type { StockAdjustmentWithDetails, StockLevelWithDetails } from '@meridian/shared';

import { buildInventoryQuery, downloadInventoryExport } from '@/lib/inventory';

interface InventoryReportsTabsProps {
  stockLevels: StockLevelWithDetails[];
  adjustments: StockAdjustmentWithDetails[];
  metrics: {
    totalSkus: number;
    totalUnits: number;
    lowStockCount: number;
  };
  token: string;
}

export function InventoryReportsTabs({
  stockLevels,
  adjustments,
  metrics,
  token,
}: InventoryReportsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'stock';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const [exportError, setExportError] = useState('');

  const t = useTranslations('merchant.inventory.reports');
  const tStock = useTranslations('merchant.inventory.stock');
  const tAdj = useTranslations('merchant.inventory.adjustments');
  const tCommon = useTranslations('common');

  function setTab(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    router.push(`/inventory/reports?${params.toString()}`);
  }

  function updateDateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/inventory/reports?${params.toString()}`);
  }

  async function exportStock() {
    setExportError('');
    try {
      await downloadInventoryExport(
        '/merchant/inventory/reports/export/stock',
        token,
        'stock-report.csv',
      );
    } catch (err) {
      setExportError(err instanceof Error ? err.message : tCommon('errors.saveFailed'));
    }
  }

  async function exportAdjustments() {
    setExportError('');
    try {
      const qs = buildInventoryQuery({ from, to });
      await downloadInventoryExport(
        `/merchant/inventory/reports/export/adjustments${qs}`,
        token,
        'adjustments-report.csv',
      );
    } catch (err) {
      setExportError(err instanceof Error ? err.message : tCommon('errors.saveFailed'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-border/50">
        <button
          type="button"
          onClick={() => setTab('stock')}
          className={`min-h-11 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'stock'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('tabStock')}
        </button>
        <button
          type="button"
          onClick={() => setTab('adjustments')}
          className={`min-h-11 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'adjustments'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('tabAdjustments')}
        </button>
      </div>

      {exportError ? <p className="text-sm text-destructive">{exportError}</p> : null}

      {tab === 'stock' ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard title={t('totalSkus')} value={metrics.totalSkus} />
            <MetricCard title={t('totalUnits')} value={metrics.totalUnits.toLocaleString()} />
            <MetricCard title={t('lowStockCount')} value={metrics.lowStockCount} />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={exportStock} className="min-h-11">
              {t('exportCsv')}
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tStock('product')}</TableHead>
                  <TableHead>{tAdj('variant')}</TableHead>
                  <TableHead>{tStock('sku')}</TableHead>
                  <TableHead className="text-right">{tStock('onHand')}</TableHead>
                  <TableHead className="text-right">{tStock('threshold')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockLevels.map((level) => (
                  <TableRow key={level.id}>
                    <TableCell>{level.variant.productName}</TableCell>
                    <TableCell>{level.variant.name}</TableCell>
                    <TableCell className="font-mono text-xs">{level.variant.sku}</TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {level.quantityOnHand}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {level.variant.reorderThreshold ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="rep-from">{tAdj('filterFrom')}</Label>
              <Input
                id="rep-from"
                type="date"
                value={from}
                onChange={(e) => updateDateFilter('from', e.target.value)}
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rep-to">{tAdj('filterTo')}</Label>
              <Input
                id="rep-to"
                type="date"
                value={to}
                onChange={(e) => updateDateFilter('to', e.target.value)}
                className="min-h-11"
              />
            </div>
            <Button variant="outline" onClick={exportAdjustments} className="min-h-11">
              {t('exportCsv')}
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tAdj('date')}</TableHead>
                  <TableHead>{tStock('product')}</TableHead>
                  <TableHead className="text-right">{tAdj('delta')}</TableHead>
                  <TableHead>{tAdj('reason')}</TableHead>
                  <TableHead>{tAdj('actor')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{row.variant.productName}</TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm ${
                        row.quantityDelta > 0 ? 'text-emerald-600' : 'text-destructive'
                      }`}
                    >
                      {row.quantityDelta > 0 ? `+${row.quantityDelta}` : row.quantityDelta}
                    </TableCell>
                    <TableCell>
                      <StockAdjustmentReasonBadge reason={row.reason} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.actor.email}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
