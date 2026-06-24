'use client';

import { useRouter, useSearchParams } from 'next/navigation';
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
      setExportError(err instanceof Error ? err.message : 'Export failed');
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
      setExportError(err instanceof Error ? err.message : 'Export failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setTab('stock')}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === 'stock'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          Stock summary
        </button>
        <button
          type="button"
          onClick={() => setTab('adjustments')}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === 'adjustments'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          Adjustment history
        </button>
      </div>

      {exportError ? <p className="text-sm text-destructive">{exportError}</p> : null}

      {tab === 'stock' ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard title="Total SKUs" value={metrics.totalSkus} />
            <MetricCard title="Units on hand" value={metrics.totalUnits.toLocaleString()} />
            <MetricCard title="Low-stock count" value={metrics.lowStockCount} />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={exportStock}>
              Export CSV
            </Button>
          </div>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockLevels.map((level) => (
                  <TableRow key={level.id}>
                    <TableCell>{level.variant.productName}</TableCell>
                    <TableCell>{level.variant.name}</TableCell>
                    <TableCell className="font-mono text-xs">{level.variant.sku}</TableCell>
                    <TableCell>{level.warehouse.name}</TableCell>
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
              <Label htmlFor="rep-from">From</Label>
              <Input
                id="rep-from"
                type="date"
                value={from}
                onChange={(e) => updateDateFilter('from', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rep-to">To</Label>
              <Input
                id="rep-to"
                type="date"
                value={to}
                onChange={(e) => updateDateFilter('to', e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={exportAdjustments}>
              Export CSV
            </Button>
          </div>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Delta</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(adj.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{adj.variant.productName}</TableCell>
                    <TableCell>{adj.warehouse.name}</TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm ${
                        adj.quantityDelta > 0 ? 'text-emerald-600' : 'text-destructive'
                      }`}
                    >
                      {adj.quantityDelta > 0 ? `+${adj.quantityDelta}` : adj.quantityDelta}
                    </TableCell>
                    <TableCell>
                      <StockAdjustmentReasonBadge reason={adj.reason} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {adj.actor.email}
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
