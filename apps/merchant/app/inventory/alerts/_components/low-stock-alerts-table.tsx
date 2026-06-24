'use client';

import Link from 'next/link';
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

import { inventoryZh } from '@/lib/i18n/inventory-zh';

interface LowStockAlertsTableProps {
  items: LowStockAlertItem[];
}

/** 低库存预警表格：支持跳转调整与新建采购单 */
export function LowStockAlertsTable({ items }: LowStockAlertsTableProps) {
  const zh = inventoryZh.alerts;
  const stock = inventoryZh.stock;
  const common = inventoryZh.common;

  if (items.length === 0) {
    return <EmptyState title={zh.emptyTitle} description={zh.emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{common.status}</TableHead>
            <TableHead>{stock.product} / {stock.sku}</TableHead>
            <TableHead className="text-right">{zh.onHand}</TableHead>
            <TableHead className="text-right">{zh.threshold}</TableHead>
            <TableHead className="text-right">{common.actions}</TableHead>
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
                  <Badge variant="destructive">{stock.outOfStock}</Badge>
                ) : (
                  <Badge variant="warning">{stock.lowStock}</Badge>
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
                    {inventoryZh.adjustments.record}
                  </Link>
                  <Link
                    href={`/inventory/purchase-orders/new?variantId=${item.variantId}`}
                    className="inline-flex min-h-9 items-center rounded-full border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
                  >
                    {zh.reorder}
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
