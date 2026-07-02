'use client';

import { useTranslations } from 'next-intl';
import { Button, Dialog, DialogCloseButton, Input, Label } from '@meridian/ui';

import type { MasterSku } from '@/lib/api';

interface EditSkuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sku: MasterSku | null;
  skuName: string;
  onHand: string;
  unitCost: string;
  wholesalePrice: string;
  retailPrice: string;
  submitting: boolean;
  onSkuNameChange: (value: string) => void;
  onOnHandChange: (value: string) => void;
  onUnitCostChange: (value: string) => void;
  onWholesalePriceChange: (value: string) => void;
  onRetailPriceChange: (value: string) => void;
  onSubmit: () => void;
}

export function EditSkuDialog({
  open,
  onOpenChange,
  sku,
  skuName,
  onHand,
  unitCost,
  wholesalePrice,
  retailPrice,
  submitting,
  onSkuNameChange,
  onOnHandChange,
  onUnitCostChange,
  onWholesalePriceChange,
  onRetailPriceChange,
  onSubmit,
}: EditSkuDialogProps) {
  const t = useTranslations('admin.allocations');
  const tc = useTranslations('common');

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('editSku')}
      footer={
        <>
          <DialogCloseButton onClose={() => onOpenChange(false)}>{tc('cancel')}</DialogCloseButton>
          <Button onClick={onSubmit} disabled={submitting || !skuName}>
            {t('form.submitSku')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {sku ? <p className="text-sm text-muted-foreground font-mono">{sku.skuCode}</p> : null}
        <div className="space-y-2">
          <Label htmlFor="edit-sku-name">{t('form.skuName')}</Label>
          <Input id="edit-sku-name" value={skuName} onChange={(e) => onSkuNameChange(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="edit-sku-onhand">{t('form.onHand')}</Label>
            <Input
              id="edit-sku-onhand"
              type="number"
              min="0"
              value={onHand}
              onChange={(e) => onOnHandChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-sku-cost">{t('form.unitCost')}</Label>
            <Input
              id="edit-sku-cost"
              type="number"
              min="0"
              step="0.01"
              value={unitCost}
              onChange={(e) => onUnitCostChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-sku-wholesale">{t('form.wholesalePrice')}</Label>
            <Input
              id="edit-sku-wholesale"
              type="number"
              min="0"
              step="0.01"
              value={wholesalePrice}
              onChange={(e) => onWholesalePriceChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-sku-retail">{t('form.retailPrice')}</Label>
            <Input
              id="edit-sku-retail"
              type="number"
              min="0"
              step="0.01"
              value={retailPrice}
              onChange={(e) => onRetailPriceChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
