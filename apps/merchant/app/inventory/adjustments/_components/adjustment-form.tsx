'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Textarea,
  StockAdjustmentReasonBadge,
} from '@meridian/ui';
import { StockAdjustmentReason } from '@meridian/shared';
import type { StockAdjustmentWithDetails, Warehouse } from '@meridian/shared';

import { apiFetch, type Product } from '@/lib/api';
import { inventoryZh } from '@/lib/i18n/inventory-zh';
import type { VariantOption } from '@/lib/product-variants';

interface AdjustmentFormProps {
  warehouses: Warehouse[];
  variants: VariantOption[];
  token: string;
  defaultWarehouseId?: string;
  prefillVariantId?: string;
  prefillWarehouseId?: string;
}

export function AdjustmentForm({
  warehouses,
  variants,
  token,
  defaultWarehouseId,
  prefillVariantId,
  prefillWarehouseId,
}: AdjustmentFormProps) {
  const router = useRouter();
  const [warehouseId, setWarehouseId] = useState(
    prefillWarehouseId ?? defaultWarehouseId ?? warehouses[0]?.id ?? '',
  );
  const [variantId, setVariantId] = useState(prefillVariantId ?? '');
  const [direction, setDirection] = useState<'increase' | 'decrease'>('increase');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState<StockAdjustmentReason>(StockAdjustmentReason.COUNT_CORRECTION);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [variantSearch, setVariantSearch] = useState('');

  const filteredVariants = variants.filter((v) => {
    const q = variantSearch.toLowerCase();
    return (
      !q ||
      v.sku.toLowerCase().includes(q) ||
      v.name.toLowerCase().includes(q) ||
      v.productName.toLowerCase().includes(q)
    );
  });

  const zh = inventoryZh.adjustments;
  const common = inventoryZh.common;
  const reasons = inventoryZh.adjustmentReason;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const qty = Math.max(1, parseInt(quantity, 10) || 0);
    const quantityDelta = direction === 'increase' ? qty : -qty;

    try {
      await apiFetch('/merchant/inventory/adjustments', {
        method: 'POST',
        body: JSON.stringify({
          warehouseId,
          variantId,
          quantityDelta,
          reason,
          note: note || undefined,
        }),
      }, token);
      setQuantity('1');
      setNote('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.failed);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{zh.record}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adj-warehouse">{zh.warehouse}</Label>
              <Select
                id="adj-warehouse"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                required
                className="min-h-11"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adj-variant-search">{zh.variant}</Label>
              <Input
                id="adj-variant-search"
                placeholder={zh.variantSearch}
                value={variantSearch}
                onChange={(e) => setVariantSearch(e.target.value)}
                className="min-h-11"
              />
              <Select
                id="adj-variant"
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
                required
                className="min-h-11"
              >
                <option value="">请选择变体</option>
                {filteredVariants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.productName} — {v.sku}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{zh.direction}</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="direction"
                  checked={direction === 'increase'}
                  onChange={() => setDirection('increase')}
                />
                {zh.increase}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="direction"
                  checked={direction === 'decrease'}
                  onChange={() => setDirection('decrease')}
                />
                {zh.decrease}
              </label>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="adj-qty">{zh.quantity}</Label>
              <Input
                id="adj-qty"
                type="number"
                min={1}
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adj-reason">{zh.reason}</Label>
              <Select
                id="adj-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as StockAdjustmentReason)}
                className="min-h-11"
              >
                <option value={StockAdjustmentReason.DAMAGE}>{reasons.DAMAGE}</option>
                <option value={StockAdjustmentReason.COUNT_CORRECTION}>{reasons.COUNT_CORRECTION}</option>
                <option value={StockAdjustmentReason.RETURN}>{reasons.RETURN}</option>
                <option value={StockAdjustmentReason.OTHER}>{reasons.OTHER}</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adj-note">{zh.note}</Label>
            <Textarea
              id="adj-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={reason === StockAdjustmentReason.OTHER ? '选择「其他」时请填写说明' : '选填'}
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert" aria-live="polite">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="min-h-11">{zh.submit}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface AdjustmentsHistoryTableProps {
  adjustments: StockAdjustmentWithDetails[];
  total: number;
  page: number;
  warehouses: Warehouse[];
}

export function AdjustmentsHistoryTable({
  adjustments,
  total,
  page,
  warehouses,
}: AdjustmentsHistoryTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const zh = inventoryZh.adjustments;
  const common = inventoryZh.common;
  const reasons = inventoryZh.adjustmentReason;
  const warehouseId = searchParams.get('warehouseId') ?? '';
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
      <h2 className="text-lg font-medium">{zh.history}</h2>
      <div className="flex flex-wrap gap-3">
        <div className="space-y-2">
          <Label htmlFor="from-date">{zh.filterFrom}</Label>
          <Input
            id="from-date"
            type="date"
            value={from}
            onChange={(e) => updateFilter('from', e.target.value)}
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to-date">{zh.filterTo}</Label>
          <Input
            id="to-date"
            type="date"
            value={to}
            onChange={(e) => updateFilter('to', e.target.value)}
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hist-warehouse">{zh.warehouse}</Label>
          <Select
            id="hist-warehouse"
            value={warehouseId}
            onChange={(e) => updateFilter('warehouseId', e.target.value)}
            className="min-h-11"
          >
            <option value="">{common.allWarehouses}</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hist-reason">{zh.filterReason}</Label>
          <Select
            id="hist-reason"
            value={reason}
            onChange={(e) => updateFilter('reason', e.target.value)}
            className="min-h-11"
          >
            <option value="">全部</option>
            {Object.values(StockAdjustmentReason).map((r) => (
              <option key={r} value={r}>
                {reasons[r as keyof typeof reasons] ?? r}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {adjustments.length === 0 ? (
        <EmptyState title={zh.emptyHistory} />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日期</TableHead>
                <TableHead>{inventoryZh.stock.product}</TableHead>
                <TableHead>{zh.warehouse}</TableHead>
                <TableHead className="text-right">变动</TableHead>
                <TableHead className="text-right">调整前 → 后</TableHead>
                <TableHead>{zh.reason}</TableHead>
                <TableHead>操作人</TableHead>
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
                  <TableCell>{adj.warehouse.name}</TableCell>
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
          <span>{common.pageOf(page, total)}</span>
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
              {common.previous}
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
              {common.next}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
