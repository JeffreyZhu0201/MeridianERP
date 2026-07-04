'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  Button,
  EmptyState,
  formatMoney,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';

import { apiFetch } from '@/lib/api';

export interface PlatformProcurementOrderRow {
  id: string;
  orderNumber: string;
  tenantName: string;
  status: string;
  totalAmount: string | number;
  lineCount: number;
  paidAt: string | null;
  createdAt: string;
  receivingAddress: {
    label: string;
    contactName: string;
    contactPhone: string;
    address: string;
  } | null;
  lines: Array<{
    skuCode: string;
    productName: string;
    quantityOrdered: number;
    unitWholesalePrice: string | number;
  }>;
}

interface ProcurementViewProps {
  orders: PlatformProcurementOrderRow[];
  token: string;
}

export function ProcurementView({ orders, token }: ProcurementViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin.procurement');
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const formatCNY = (value: string | number) => formatMoney(value, 'CNY', locale);

  function statusLabel(status: string) {
    if (
      status === 'PROCESSING' ||
      status === 'SHIPPED' ||
      status === 'RECEIVED' ||
      status === 'PENDING_PAYMENT'
    ) {
      return t(`orderStatus.${status as 'orderStatus.PROCESSING'}`);
    }
    return status;
  }

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
    return <EmptyState title={t('empty')} description={t('emptyDescription')} />;
  }

  return (
    <>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <div className="rounded-xl ring-1 ring-border">
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
              <TableHead className="text-right">{t('columns.actions')}</TableHead>
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
                  <Badge variant="secondary">{statusLabel(order.status)}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {order.paidAt ? new Date(order.paidAt).toLocaleString(locale) : '—'}
                </TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
