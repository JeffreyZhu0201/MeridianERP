'use client';

import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@meridian/ui';

import type { PlatformOrder } from '@/lib/api';

interface OrdersTableProps {
  orders: PlatformOrder[];
}

function formatPrice(price: string | number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(price));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PAID: 'default',
  FULFILLED: 'default',
  PENDING_PAYMENT: 'secondary',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
};

export function OrdersTable({ orders }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-muted-foreground">No orders found</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Merchant</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Distributor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}…</TableCell>
              <TableCell>
                {order.tenant.businessName ?? order.tenant.slug}
              </TableCell>
              <TableCell>{order.guestEmail ?? '—'}</TableCell>
              <TableCell>{order.distributor?.name ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[order.status] ?? 'secondary'}>
                  {order.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatPrice(order.total, order.currency)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDate(order.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
