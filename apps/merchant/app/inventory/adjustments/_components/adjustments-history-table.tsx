'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Button,
  EmptyState,
  Input,
  Label,
  Select,
  StockAdjustmentReasonBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import { StockAdjustmentReason } from '@meridian/shared';
import type { StockAdjustmentWithDetails } from '@meridian/shared';

interface AdjustmentsHistoryTableProps {
  adjustments: StockAdjustmentWithDetails[];
  total: number;
  page: number;
}

export function AdjustmentsHistoryTable({
  adjustments,
  total,
  page,
}: AdjustmentsHistoryTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('merchant.inventory.adjustments');
  const tStock = useTranslations('merchant.inventory.stock');
  const tCommon = useTranslations('common');
  const tReasons = useTranslations('merchant.inventory.adjustmentReason');
  const reason = searchParams.get('reason') ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`/inventory/adjustments?${params.toString()}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">{t('history')}</h2>
      <div className="flex flex-wrap gap-3">
        <div className="space-y-2">
          <Label htmlFor="from-date">{t('filterFrom')}</Label>
          <Input
            id="from-date"
            type="date"
            value={from}
            onChange={(e) => updateFilter('from', e.target.value)}
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to-date">{t('filterTo')}</Label>
          <Input
            id="to-date"
            type="date"
            value={to}
            onChange={(e) => updateFilter('to', e.target.value)}
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hist-reason">{t('filterReason')}</Label>
          <Select
            id="hist-reason"
            value={reason}
            onChange={(e) => updateFilter('reason', e.target.value)}
            className="min-h-11"
          >
            <option value="">{t('allReasons')}</option>
            {Object.values(StockAdjustmentReason).map((r) => (
              <option key={r} value={r}>
                {tReasons(r)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {adjustments.length === 0 ? (
        <EmptyState title={t('emptyHistory')} />
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{tStock('product')}</TableHead>
                <TableHead className="text-right">{t('delta')}</TableHead>
                <TableHead className="text-right">{t('beforeAfter')}</TableHead>
                <TableHead>{t('reason')}</TableHead>
                <TableHead>{t('actor')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.map((adj) => (
                <TableRow key={adj.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(adj.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div>{adj.variant.productName}</div>
                    <div className="font-mono text-xs text-muted-foreground">{adj.variant.sku}</div>
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono text-sm tabular-nums ${
                      adj.quantityDelta > 0 ? 'text-emerald-600' : 'text-destructive'
                    }`}
                  >
                    {adj.quantityDelta > 0 ? `+${adj.quantityDelta}` : adj.quantityDelta}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {adj.quantityBefore} → {adj.quantityAfter}
                  </TableCell>
                  <TableCell>
                    <StockAdjustmentReasonBadge reason={adj.reason} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{adj.actor.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {total > 20 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{tCommon('pageOf', { page, total })}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="min-h-9"
              disabled={page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', String(page - 1));
                router.push(`/inventory/adjustments?${params.toString()}`);
              }}
            >
              {tCommon('previous')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="min-h-9"
              disabled={page >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', String(page + 1));
                router.push(`/inventory/adjustments?${params.toString()}`);
              }}
            >
              {tCommon('next')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
