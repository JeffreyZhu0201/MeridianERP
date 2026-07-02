'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Textarea,
} from '@meridian/ui';
import { StockAdjustmentReason } from '@meridian/shared';
import type { Warehouse } from '@meridian/shared';

import { apiFetch } from '@/lib/api';
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

  const t = useTranslations('merchant.inventory.adjustments');
  const tCommon = useTranslations('common');
  const tReasons = useTranslations('merchant.inventory.adjustmentReason');

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
      setError(err instanceof Error ? err.message : t('failed'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('record')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adj-warehouse">{t('warehouse')}</Label>
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
              <Label htmlFor="adj-variant-search">{t('variant')}</Label>
              <Input
                id="adj-variant-search"
                placeholder={t('variantSearch')}
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
              <legend className="text-sm font-medium">{t('direction')}</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="direction"
                  checked={direction === 'increase'}
                  onChange={() => setDirection('increase')}
                />
                {t('increase')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="direction"
                  checked={direction === 'decrease'}
                  onChange={() => setDirection('decrease')}
                />
                {t('decrease')}
              </label>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="adj-qty">{t('quantity')}</Label>
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
              <Label htmlFor="adj-reason">{t('reason')}</Label>
              <Select
                id="adj-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as StockAdjustmentReason)}
                className="min-h-11"
              >
                <option value={StockAdjustmentReason.DAMAGE}>{tReasons('DAMAGE')}</option>
                <option value={StockAdjustmentReason.COUNT_CORRECTION}>{tReasons('COUNT_CORRECTION')}</option>
                <option value={StockAdjustmentReason.RETURN}>{tReasons('RETURN')}</option>
                <option value={StockAdjustmentReason.OTHER}>{tReasons('OTHER')}</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adj-note">{t('note')}</Label>
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

          <Button type="submit" className="min-h-11">{t('submit')}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
