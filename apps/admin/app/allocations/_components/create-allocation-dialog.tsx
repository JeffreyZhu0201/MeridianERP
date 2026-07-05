'use client';

import { useTranslations } from 'next-intl';
import { Button, Dialog, DialogCloseButton, Input, Label, Select, Textarea } from '@meridian/ui';

import type { MasterSku } from '@/lib/api';

interface ApprovedMerchant {
  id: string;
  businessName: string;
  tenantId: string;
}

interface CreateAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchants: ApprovedMerchant[];
  masterSkus: MasterSku[];
  tenantId: string;
  note: string;
  lineSkuId: string;
  lineQty: string;
  lines: Array<{ masterSkuId: string; quantity: number }>;
  submitting: boolean;
  onTenantIdChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onLineSkuIdChange: (value: string) => void;
  onLineQtyChange: (value: string) => void;
  onAddLine: () => void;
  onSubmit: () => void;
}

export function CreateAllocationDialog({
  open,
  onOpenChange,
  merchants,
  masterSkus,
  tenantId,
  note,
  lineSkuId,
  lineQty,
  lines,
  submitting,
  onTenantIdChange,
  onNoteChange,
  onLineSkuIdChange,
  onLineQtyChange,
  onAddLine,
  onSubmit,
}: CreateAllocationDialogProps) {
  const t = useTranslations('admin.masterCatalog');
  const tc = useTranslations('common');

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('createAllocation')}
      footer={
        <>
          <DialogCloseButton onClose={() => onOpenChange(false)}>{tc('cancel')}</DialogCloseButton>
          <Button onClick={onSubmit} disabled={submitting || !tenantId || lines.length === 0}>
            {t('form.submitAllocation')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="alloc-merchant">{t('form.merchant')}</Label>
          <Select id="alloc-merchant" value={tenantId} onChange={(e) => onTenantIdChange(e.target.value)}>
            {merchants.map((m) => (
              <option key={m.tenantId} value={m.tenantId!}>
                {m.businessName}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="alloc-note">{t('form.note')}</Label>
          <Textarea id="alloc-note" value={note} onChange={(e) => onNoteChange(e.target.value)} rows={2} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="alloc-sku">{t('form.sku')}</Label>
            <Select id="alloc-sku" value={lineSkuId} onChange={(e) => onLineSkuIdChange(e.target.value)}>
              {masterSkus.map((sku) => (
                <option key={sku.id} value={sku.id}>
                  {sku.skuCode} — {sku.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="alloc-qty">{t('form.quantity')}</Label>
            <Input
              id="alloc-qty"
              type="number"
              min="1"
              value={lineQty}
              onChange={(e) => onLineQtyChange(e.target.value)}
            />
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAddLine}>
          {t('form.addLine')}
        </Button>
        {lines.length > 0 ? (
          <ul className="text-sm text-muted-foreground space-y-1">
            {lines.map((line, i) => {
              const sku = masterSkus.find((s) => s.id === line.masterSkuId);
              return (
                <li key={i}>
                  {sku?.skuCode ?? line.masterSkuId} × {line.quantity}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </Dialog>
  );
}
