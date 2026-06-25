'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogCloseButton,
  EmptyState,
  Input,
  Label,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import type { StockLevelWithDetails, Warehouse } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface StockLevelsTableProps {
  initialLevels: StockLevelWithDetails[];
  initialTotal: number;
  warehouses: Warehouse[];
  token: string;
  isOwner: boolean;
  defaultThreshold: number;
}

export function StockLevelsTable({
  initialLevels,
  initialTotal,
  warehouses,
  token,
  isOwner,
  defaultThreshold,
}: StockLevelsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const warehouseId = searchParams.get('warehouseId') ?? '';
  const q = searchParams.get('q') ?? '';
  const page = Number(searchParams.get('page') ?? '1');

  const [levels, setLevels] = useState(initialLevels);
  const [total, setTotal] = useState(initialTotal);
  const [searchInput, setSearchInput] = useState(q);
  const [thresholdDialog, setThresholdDialog] = useState<StockLevelWithDetails | null>(null);
  const [thresholdValue, setThresholdValue] = useState('');
  const [useDefault, setUseDefault] = useState(false);
  const [error, setError] = useState('');

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      router.push(`/inventory/stock?${params.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== q) {
        updateParams({ q: searchInput, page: '1' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, q, updateParams]);

  useEffect(() => {
    setLevels(initialLevels);
    setTotal(initialTotal);
  }, [initialLevels, initialTotal]);

  function effectiveThreshold(level: StockLevelWithDetails): number {
    return level.variant.reorderThreshold ?? defaultThreshold;
  }

  function isLowStock(level: StockLevelWithDetails): boolean {
    return level.quantityOnHand <= effectiveThreshold(level);
  }

  function openThresholdEdit(level: StockLevelWithDetails) {
    setThresholdDialog(level);
    setUseDefault(level.variant.reorderThreshold === null);
    setThresholdValue(
      level.variant.reorderThreshold !== null
        ? String(level.variant.reorderThreshold)
        : String(defaultThreshold),
    );
    setError('');
  }

  async function saveThreshold() {
    if (!thresholdDialog) return;
    setError('');
    try {
      await apiFetch(
        `/merchant/inventory/variants/${thresholdDialog.variantId}/reorder-threshold`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            reorderThreshold: useDefault ? null : Math.max(0, parseInt(thresholdValue, 10) || 0),
          }),
        },
        token,
      );
      setThresholdDialog(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  const t = useTranslations('merchant.inventory.stock');
  const tCommon = useTranslations('common');
  const tInvCommon = useTranslations('merchant.inventory.common');

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <div className="space-y-2">
          <Label htmlFor="warehouse-filter">{t('warehouse')}</Label>
          <Select
            id="warehouse-filter"
            value={warehouseId}
            onChange={(e) => updateParams({ warehouseId: e.target.value, page: '1' })}
            className="min-h-11"
          >
            <option value="">{tInvCommon('allWarehouses')}</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-[200px] flex-1 space-y-2">
          <Label htmlFor="stock-search">{tCommon('search')}</Label>
          <Input
            id="stock-search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="min-h-11"
          />
        </div>
      </div>

      {levels.length === 0 ? (
        <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('product')}</TableHead>
                <TableHead>{t('sku')}</TableHead>
                <TableHead>{t('warehouse')}</TableHead>
                <TableHead className="text-right">{t('onHand')}</TableHead>
                <TableHead className="text-right">{t('threshold')}</TableHead>
                <TableHead>{tCommon('status')}</TableHead>
                {isOwner ? <TableHead className="w-12" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels.map((level) => (
                <TableRow
                  key={level.id}
                  className={level.quantityOnHand === 0 ? 'bg-destructive/5' : undefined}
                >
                  <TableCell>{level.variant.productName}</TableCell>
                  <TableCell>
                    <div>{level.variant.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{level.variant.sku}</div>
                  </TableCell>
                  <TableCell>{level.warehouse.name}</TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {level.quantityOnHand}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {effectiveThreshold(level)}
                  </TableCell>
                  <TableCell>
                    {level.quantityOnHand === 0 ? (
                      <Badge variant="destructive">{t('outOfStock')}</Badge>
                    ) : isLowStock(level) ? (
                      <Badge variant="warning">{t('lowStock')}</Badge>
                    ) : null}
                  </TableCell>
                  {isOwner ? (
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="min-h-9"
                        onClick={() => openThresholdEdit(level)}
                        aria-label={t('editThreshold')}
                      >
                        {tCommon('edit')}
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        门店可售库存仅统计默认仓库的在库数量。
      </p>

      {total > 20 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{tCommon('pageOf', { page, total })}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="min-h-9"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              {tCommon('previous')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="min-h-9"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              {tCommon('next')}
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog
        open={!!thresholdDialog}
        onOpenChange={(open) => !open && setThresholdDialog(null)}
        title={t('editThreshold')}
        footer={
          <>
            <DialogCloseButton onClick={() => setThresholdDialog(null)}>{tCommon('cancel')}</DialogCloseButton>
            <Button onClick={saveThreshold}>{tCommon('save')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useDefault}
              onChange={(e) => setUseDefault(e.target.checked)}
              className="size-4 rounded border-input"
            />
            {t('useDefaultThreshold')}（{defaultThreshold}）
          </label>
          {!useDefault ? (
            <div className="space-y-2">
              <Label htmlFor="threshold">{t('threshold')}</Label>
              <Input
                id="threshold"
                type="number"
                min={0}
                inputMode="numeric"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
              />
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </Dialog>
    </>
  );
}
