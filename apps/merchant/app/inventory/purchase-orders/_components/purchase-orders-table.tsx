'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  EmptyState,
  PurchaseOrderStatusBadge,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import { PurchaseOrderStatus } from '@meridian/shared';
import type { PurchaseOrder, Warehouse } from '@meridian/shared';

import { inventoryZh } from '@/lib/i18n/inventory-zh';

interface PurchaseOrdersTableProps {
  orders: Array<
    PurchaseOrder & { warehouse?: { name: string }; warehouseName?: string }
  >;
  total: number;
  page: number;
  warehouses: Warehouse[];
  token: string;
}

export function PurchaseOrdersTable({
  orders = [],
  total,
  page,
  warehouses,
}: PurchaseOrdersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const warehouseId = searchParams.get('warehouseId') ?? '';

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`/inventory/purchase-orders?${params.toString()}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));
  const zh = inventoryZh.purchaseOrders;
  const common = inventoryZh.common;
  const poStatus = inventoryZh.poStatus;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="space-y-2">
            <label htmlFor="po-status" className="text-sm font-medium">
              {zh.filterStatus}
            </label>
            <Select
              id="po-status"
              value={status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="min-h-11"
            >
              <option value="">全部</option>
              {Object.values(PurchaseOrderStatus).map((s) => (
                <option key={s} value={s}>
                  {poStatus[s as keyof typeof poStatus] ?? s}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="po-warehouse" className="text-sm font-medium">
              {zh.warehouse}
            </label>
            <Select
              id="po-warehouse"
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
        </div>
        <Link
          href="/inventory/purchase-orders/new"
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {zh.new}
        </Link>
      </div>

      {orders.length === 0 ? (
        <EmptyState title={zh.emptyTitle} description={zh.emptyDescription} />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{zh.poNumber}</TableHead>
                <TableHead>{zh.supplier}</TableHead>
                <TableHead>{zh.warehouse}</TableHead>
                <TableHead>{zh.status}</TableHead>
                <TableHead>{zh.created}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((po) => (
                <TableRow
                  key={po.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/inventory/purchase-orders/${po.id}`)}
                >
                  <TableCell>
                    <Link
                      href={`/inventory/purchase-orders/${po.id}`}
                      className="font-mono text-xs text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {po.poNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{po.supplierName}</TableCell>
                  <TableCell>
                    {po.warehouse?.name ?? po.warehouseName ?? '—'}
                  </TableCell>
                  <TableCell>
                    <PurchaseOrderStatusBadge status={po.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {po.orderedAt
                      ? new Date(po.orderedAt).toLocaleDateString()
                      : '—'}
                  </TableCell>
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
                router.push(`/inventory/purchase-orders?${params.toString()}`);
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
                router.push(`/inventory/purchase-orders?${params.toString()}`);
              }}
            >
              {common.next}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
