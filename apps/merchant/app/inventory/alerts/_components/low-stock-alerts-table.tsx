'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Badge,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import type { LowStockAlertItem } from '@meridian/shared';

interface LowStockAlertsTableProps {
  items: LowStockAlertItem[];
}

/** 低库存预警表格：支持跳转调整与新建采购单 */
export function LowStockAlertsTable({ items }: LowStockAlertsTableProps) {
  const t = useTranslations('merchant.inventory.alerts');
  const tStock = useTranslations('merchant.inventory.stock');
  const tAdj = useTranslations('merchant.inventory.adjustments');
  const tCommon = useTranslations('common');

  if (items.length === 0) {
    return <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tCommon('status')}</TableHead>
            <TableHead>{tStock('product')} / {tStock('sku')}</TableHead>
            <TableHead className="text-right">{t('onHand')}</TableHead>
            <TableHead className="text-right">{t('threshold')}</TableHead>
            <TableHead className="text-right">{tCommon('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={`${item.variantId}-${item.warehouseId}`}
              className={item.quantityOnHand === 0 ? 'bg-destructive/5' : undefined}
            >
              <TableCell>
                {item.quantityOnHand === 0 ? (
                  <Badge variant="destructive">{tStock('outOfStock')}</Badge>
                ) : (
                  <Badge variant="warning">{tStock('lowStock')}</Badge>
                )}
              </TableCell>
              <TableCell>
                <div>{item.productName}</div>
                <div className="font-mono text-xs text-muted-foreground">{item.sku}</div>
              </TableCell>
              <TableCell className="text-right font-mono text-sm tabular-nums">
                {item.quantityOnHand}
              </TableCell>
              <TableCell className="text-right font-mono text-sm tabular-nums">
                {item.reorderThreshold}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/inventory/adjustments?variantId=${item.variantId}&warehouseId=${item.warehouseId}`}
                    className="inline-flex min-h-9 items-center rounded-full border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
                  >
                    {tAdj('record')}
                  </Link>
                  <Link
                    href={`/inventory/purchase-orders/new?variantId=${item.variantId}`}
                    className="inline-flex min-h-9 items-center rounded-full border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
                  >
                    {t('reorder')}
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
