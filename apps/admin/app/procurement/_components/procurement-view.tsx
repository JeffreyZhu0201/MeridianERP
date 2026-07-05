'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  formatMoney,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import type {
  BranchPurchaseOrderStatus,
  PlatformProcurementOrderSummary,
  PlatformProcurementTabStatus,
} from '@meridian/shared';
import { formatBranchPurchaseOrderStatus } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface ProcurementViewProps {
  orders: PlatformProcurementOrderSummary[];
  token: string;
  tab: PlatformProcurementTabStatus;
}

export function ProcurementView({ orders, token, tab }: ProcurementViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin.procurement');
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const formatCNY = (value: string | number) => formatMoney(value, 'CNY', locale);
  const showActions = tab === 'PROCESSING';

  const statusLabels = useMemo(
    () =>
      ({
        PENDING_PAYMENT: t('orderStatus.PENDING_PAYMENT'),
        PAID: t('orderStatus.PAID'),
        PROCESSING: t('orderStatus.PROCESSING'),
        SHIPPED: t('orderStatus.SHIPPED'),
        RECEIVED: t('orderStatus.RECEIVED'),
        CANCELLED: t('orderStatus.CANCELLED'),
      }) satisfies Record<BranchPurchaseOrderStatus, string>,
    [t],
  );

  async function handleShip(id: string) {
    setShippingId(id);
    setError('');
    try {
      await apiFetch(`/platform/procurement/orders/${id}/ship`, { method: 'POST' }, token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('shipFailed'));
    } finally {
      setShippingId(null);
    }
  }

  if (orders.length === 0) {
    return null;
  }

  return (
    <>
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="overflow-x-auto rounded-xl ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columns.orderNumber')}</TableHead>
              <TableHead>{t('columns.branch')}</TableHead>
              <TableHead>{t('columns.receivingAddress')}</TableHead>
              <TableHead>{t('columns.lines')}</TableHead>
              <TableHead className="text-right">{t('columns.total')}</TableHead>
              <TableHead>{t('columns.status')}</TableHead>
              <TableHead>{t('columns.paidAt')}</TableHead>
              {showActions ? (
                <TableHead className="text-right">{t('columns.actions')}</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                <TableCell>{order.tenantName}</TableCell>
                <TableCell className="max-w-[220px] text-xs">
                  {order.receivingAddress ? (
                    <>
                      <div className="font-medium">{order.receivingAddress.label}</div>
                      <div className="text-muted-foreground">
                        {order.receivingAddress.contactName} · {order.receivingAddress.contactPhone}
                      </div>
                      <div className="truncate">{order.receivingAddress.address}</div>
                    </>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {order.lines.map((line) => (
                    <div key={`${order.id}-${line.skuCode}`}>
                      {line.productName} × {line.quantityOrdered}
                    </div>
                  ))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCNY(order.totalAmount)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {formatBranchPurchaseOrderStatus(order.status, statusLabels)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {order.paidAt ? new Date(order.paidAt).toLocaleString(locale) : '—'}
                </TableCell>
                {showActions ? (
                  <TableCell className="text-right">
                    {order.status === 'PROCESSING' ? (
                      <Button
                        size="sm"
                        disabled={shippingId === order.id}
                        onClick={() => handleShip(order.id)}
                      >
                        {shippingId === order.id ? '…' : t('ship')}
                      </Button>
                    ) : null}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
