'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Button,
  FormPageFrame,
  Input,
  Label,
  Select,
} from '@meridian/ui';
import type { Warehouse } from '@meridian/shared';

import { apiFetch } from '@/lib/api';
import type { PoVariantOption } from '@/lib/product-variants';

interface TransferLine {
  variantId: string;
  quantity: string;
}

interface TransferFormProps {
  warehouses: Warehouse[];
  variants: PoVariantOption[];
  token: string;
  prefillVariantId?: string;
}

export function TransferForm({
  warehouses,
  variants,
  token,
  prefillVariantId,
}: TransferFormProps) {
  const router = useRouter();
  const t = useTranslations('merchant.inventory.transfers');
  const tCommon = useTranslations('common');

  const defaultWarehouse = warehouses.find((w) => w.isDefault);
  const alternateWarehouse = warehouses.find((w) => !w.isDefault) ?? warehouses[1];

  const [fromWarehouseId, setFromWarehouseId] = useState(
    defaultWarehouse?.id ?? warehouses[0]?.id ?? '',
  );
  const [toWarehouseId, setToWarehouseId] = useState(alternateWarehouse?.id ?? '');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<TransferLine[]>(
    prefillVariantId
      ? [{ variantId: prefillVariantId, quantity: '1' }]
      : [{ variantId: '', quantity: '1' }],
  );
  const [error, setError] = useState('');

  function addLine() {
    setLines((prev) => [...prev, { variantId: '', quantity: '1' }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof TransferLine, value: string) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  }

  async function submit() {
    setError('');

    if (fromWarehouseId === toWarehouseId) {
      setError(t('sameWarehouseError'));
      return;
    }

    const payload = {
      fromWarehouseId,
      toWarehouseId,
      note: note.trim() || undefined,
      lines: lines
        .filter((l) => l.variantId)
        .map((l) => ({
          variantId: l.variantId,
          quantity: Math.max(1, parseInt(l.quantity, 10) || 1),
        })),
    };

    if (payload.lines.length === 0) {
      setError(t('noLinesError'));
      return;
    }

    try {
      await apiFetch('/merchant/inventory/transfers', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, token);
      router.push('/inventory/transfers');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
    }
  }

  return (
    <FormPageFrame
      title={t('newTitle')}
      description={t('newDescription')}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => router.push('/inventory/transfers')}>
            {tCommon('cancel')}
          </Button>
          <Button type="button" onClick={() => void submit()}>
            {t('submit')}
          </Button>
        </>
      }
    >
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="from-warehouse">{t('fromWarehouse')}</Label>
            <Select
              id="from-warehouse"
              value={fromWarehouseId}
              onChange={(e) => setFromWarehouseId(e.target.value)}
              className="min-h-11"
              required
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="to-warehouse">{t('toWarehouse')}</Label>
            <Select
              id="to-warehouse"
              value={toWarehouseId}
              onChange={(e) => setToWarehouseId(e.target.value)}
              className="min-h-11"
              required
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transfer-note">{t('note')}</Label>
          <Input
            id="transfer-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('notePlaceholder')}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{t('lines')}</h3>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              {t('addLine')}
            </Button>
          </div>

          {lines.map((line, index) => (
            <div key={index} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_120px_auto]">
              <div className="space-y-2">
                <Label htmlFor={`variant-${index}`}>{t('variant')}</Label>
                <Select
                  id={`variant-${index}`}
                  value={line.variantId}
                  onChange={(e) => updateLine(index, 'variantId', e.target.value)}
                  className="min-h-11"
                  required
                >
                  <option value="">{t('selectVariant')}</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`quantity-${index}`}>{t('quantity')}</Label>
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                  required
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={lines.length === 1}
                  onClick={() => removeLine(index)}
                >
                  {tCommon('cancel')}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormPageFrame>
  );
}
