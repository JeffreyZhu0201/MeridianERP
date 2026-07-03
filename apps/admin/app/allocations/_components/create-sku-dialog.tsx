'use client';

import { useTranslations } from 'next-intl';
import { Button, Dialog, DialogCloseButton, Input, Label } from '@meridian/ui';

interface CreateSkuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skuCode: string;
  skuName: string;
  onHand: string;
  unitCost: string;
  wholesalePrice: string;
  retailPrice: string;
  flagshipPrice: string;
  submitting: boolean;
  onSkuCodeChange: (value: string) => void;
  onSkuNameChange: (value: string) => void;
  onOnHandChange: (value: string) => void;
  onUnitCostChange: (value: string) => void;
  onWholesalePriceChange: (value: string) => void;
  onRetailPriceChange: (value: string) => void;
  onFlagshipPriceChange: (value: string) => void;
  onSubmit: () => void;
}

export function CreateSkuDialog({
  open,
  onOpenChange,
  skuCode,
  skuName,
  onHand,
  unitCost,
  wholesalePrice,
  retailPrice,
  flagshipPrice,
  submitting,
  onSkuCodeChange,
  onSkuNameChange,
  onOnHandChange,
  onUnitCostChange,
  onWholesalePriceChange,
  onRetailPriceChange,
  onFlagshipPriceChange,
  onSubmit,
}: CreateSkuDialogProps) {
  const t = useTranslations('admin.allocations');
  const tc = useTranslations('common');

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('createSku')}
      footer={
        <>
          <DialogCloseButton onClose={() => onOpenChange(false)}>{tc('cancel')}</DialogCloseButton>
          <Button onClick={onSubmit} disabled={submitting || !skuCode || !skuName}>
            {t('form.submitSku')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sku-code">{t('form.skuCode')}</Label>
          <Input id="sku-code" value={skuCode} onChange={(e) => onSkuCodeChange(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku-name">{t('form.skuName')}</Label>
          <Input id="sku-name" value={skuName} onChange={(e) => onSkuNameChange(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sku-onhand">{t('form.onHand')}</Label>
            <Input
              id="sku-onhand"
              type="number"
              min="0"
              value={onHand}
              onChange={(e) => onOnHandChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku-cost">{t('form.unitCost')}</Label>
            <Input
              id="sku-cost"
              type="number"
              min="0"
              step="0.01"
              value={unitCost}
              onChange={(e) => onUnitCostChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku-wholesale">{t('form.wholesalePrice')}</Label>
            <Input
              id="sku-wholesale"
              type="number"
              min="0"
              step="0.01"
              value={wholesalePrice}
              onChange={(e) => onWholesalePriceChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku-retail">{t('form.retailPrice')}</Label>
            <Input
              id="sku-retail"
              type="number"
              min="0"
              step="0.01"
              value={retailPrice}
              onChange={(e) => onRetailPriceChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku-flagship">{t('form.flagshipPrice')}</Label>
            <Input
              id="sku-flagship"
              type="number"
              min="0"
              step="0.01"
              value={flagshipPrice}
              onChange={(e) => onFlagshipPriceChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
