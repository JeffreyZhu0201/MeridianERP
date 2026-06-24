'use client';

import Link from 'next/link';
import {
  Badge,
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

export function LowStockAlertsTable({ items }: LowStockAlertsTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          All variants are above reorder thresholds
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Product / SKU</TableHead>
            <TableHead className="text-right">On hand</TableHead>
            <TableHead className="text-right">Threshold</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                  <Badge variant="destructive">Out of stock</Badge>
                ) : (
                  <Badge variant="warning">Low stock</Badge>
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
                    className="inline-flex h-8 items-center rounded-full border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
                  >
                    Adjust
                  </Link>
                  <Link
                    href={`/inventory/purchase-orders/new?variantId=${item.variantId}`}
                    className="inline-flex h-8 items-center rounded-full border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
                  >
                    Create PO
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
