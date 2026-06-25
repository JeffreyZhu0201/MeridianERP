'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Button,
  FormPageFrame,
  Input,
  Label,
  Select,
} from '@meridian/ui';
import type { Warehouse } from '@meridian/shared';

import { apiFetch, type Product } from '@/lib/api';

interface PoLine {
  variantId: string;
  quantityOrdered: string;
}

interface VariantOption {
  id: string;
  label: string;
}

interface PurchaseOrderFormProps {
  warehouses: Warehouse[];
  variants: VariantOption[];
  token: string;
  prefillVariantId?: string;
  purchaseOrderId?: string;
  initial?: {
    supplierName: string;
    warehouseId: string;
    lines: PoLine[];
  };
}

export function PurchaseOrderForm({
  warehouses,
  variants,
  token,
  prefillVariantId,
  purchaseOrderId,
  initial,
}: PurchaseOrderFormProps) {
  const t = useTranslations('merchant.inventory.purchaseOrders.form');
  const tc = useTranslations('common');
  const router = useRouter();
  const isEdit = !!purchaseOrderId;
  const [supplierName, setSupplierName] = useState(initial?.supplierName ?? '');
  const [warehouseId, setWarehouseId] = useState(
    initial?.warehouseId ?? warehouses.find((w) => w.isDefault)?.id ?? warehouses[0]?.id ?? '',
  );
  const [createStatus, setCreateStatus] = useState<'DRAFT' | 'ORDERED'>('DRAFT');
  const [lines, setLines] = useState<PoLine[]>(
    initial?.lines ??
      (prefillVariantId
        ? [{ variantId: prefillVariantId, quantityOrdered: '1' }]
        : [{ variantId: '', quantityOrdered: '1' }]),
  );
  const [error, setError] = useState('');

  function addLine() {
    setLines((prev) => [...prev, { variantId: '', quantityOrdered: '1' }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof PoLine, value: string) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  }

  async function save(status: 'DRAFT' | 'ORDERED') {
    setError('');
    const payload = {
      supplierName,
      warehouseId,
      status,
      lines: lines
        .filter((l) => l.variantId)
        .map((l) => ({
          variantId: l.variantId,
          quantityOrdered: Math.max(1, parseInt(l.quantityOrdered, 10) || 1),
        })),
    };

    if (payload.lines.length === 0) {
      setError(t('minLineError'));
      return;
    }

    try {
      if (isEdit) {
        await apiFetch(`/merchant/inventory/purchase-orders/${purchaseOrderId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            supplierName: payload.supplierName,
            warehouseId: payload.warehouseId,
            lines: payload.lines,
          }),
        }, token);
        if (status === 'ORDERED') {
          await apiFetch(`/merchant/inventory/purchase-orders/${purchaseOrderId}/submit`, {
            method: 'POST',
          }, token);
        }
        router.push(`/inventory/purchase-orders/${purchaseOrderId}`);
      } else {
        const created = await apiFetch<{ id: string }>('/merchant/inventory/purchase-orders', {
          method: 'POST',
          body: JSON.stringify(payload),
        }, token);
        router.push(`/inventory/purchase-orders/${created.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc('errors.saveFailed'));
    }
  }

  return (
    <FormPageFrame
      title={isEdit ? t('editTitle') : t('createTitle')}
      footer={
        <>
          <Button variant="outline" onClick={() => router.push('/inventory/purchase-orders')}>
            {tc('cancel')}
          </Button>
          {isEdit ? (
            <>
              <Button variant="outline" onClick={() => save('DRAFT')}>
                {t('saveDraft')}
              </Button>
              <Button onClick={() => save('ORDERED')}>{t('saveAndOrder')}</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => save('DRAFT')}>
                {t('saveDraft')}
              </Button>
              <Button onClick={() => save(createStatus)}>
                {createStatus === 'ORDERED' ? t('saveAndOrder') : t('saveDraft')}
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="supplier">{t('supplierName')}</Label>
          <Input
            id="supplier"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="po-warehouse">{t('targetWarehouse')}</Label>
          <Select
            id="po-warehouse"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {!isEdit ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t('createAs')}</legend>
          <label className="mr-4 flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="createStatus"
              checked={createStatus === 'DRAFT'}
              onChange={() => setCreateStatus('DRAFT')}
            />
            {t('saveDraft')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="createStatus"
              checked={createStatus === 'ORDERED'}
              onChange={() => setCreateStatus('ORDERED')}
            />
            {t('markOrdered')}
          </label>
        </fieldset>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{t('lineItems')}</h2>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            {t('addLine')}
          </Button>
        </div>
        {lines.map((line, index) => (
          <div key={index} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-2">
              <Label htmlFor={`variant-${index}`}>{t('variant')}</Label>
              <Select
                id={`variant-${index}`}
                value={line.variantId}
                onChange={(e) => updateLine(index, 'variantId', e.target.value)}
              >
                <option value="">{t('selectVariant')}</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-32 space-y-2">
              <Label htmlFor={`qty-${index}`}>{t('qtyOrdered')}</Label>
              <Input
                id={`qty-${index}`}
                type="number"
                min={1}
                value={line.quantityOrdered}
                onChange={(e) => updateLine(index, 'quantityOrdered', e.target.value)}
              />
            </div>
            {lines.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(index)}>
                {tc('remove')}
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </FormPageFrame>
  );
}
