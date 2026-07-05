'use client';

import Link from 'next/link';
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
  toast,
} from '@meridian/ui';
import type { BranchPurchaseOrderDetail, BranchPurchaseOrderStatus } from '@meridian/shared';
import { formatBranchPurchaseOrderStatus } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface ProcurementOrderDetailProps {
  order: BranchPurchaseOrderDetail;
  token: string;
}

export function ProcurementOrderDetail({ order, token }: ProcurementOrderDetailProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('merchant.inventory.procurement');
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const formatCNY = (value: string | number) => formatMoney(value, 'CNY', locale);

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

  async function handlePay() {
    setPaying(true);
    setError('');
    try {
      await apiFetch(`/merchant/procurement/orders/${order.id}/pay`, { method: 'POST' }, token);
      toast.success(t('paySuccess'));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('payFailed'));
    } finally {
      setPaying(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    setError('');
    try {
      await apiFetch(
        `/merchant/procurement/orders/${order.id}/confirm-receipt`,
        { method: 'POST' },
        token,
      );
      toast.success(t('confirmSuccess'));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('confirmFailed'));
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('orderNumber')}</p>
          <h2 className="font-mono text-lg">{order.orderNumber}</h2>
        </div>
        <Badge variant="secondary">
          {formatBranchPurchaseOrderStatus(order.status, statusLabels)}
        </Badge>
      </div>

      <div className="grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">{t('total')}</p>
          <p className="font-medium tabular-nums">{formatCNY(order.totalAmount)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t('created')}</p>
          <p>{new Date(order.createdAt).toLocaleString(locale)}</p>
        </div>
        {order.paidAt ? (
          <div>
            <p className="text-muted-foreground">{t('paidAt')}</p>
            <p>{new Date(order.paidAt).toLocaleString(locale)}</p>
          </div>
        ) : null}
      </div>

      {order.note ? (
        <p className="text-sm text-muted-foreground">
          {t('note')}：{order.note}
        </p>
      ) : null}

      {order.receivingAddress ? (
        <div className="rounded-xl border border-border p-4 text-sm">
          <p className="font-medium">{t('receivingAddress')}</p>
          <p className="mt-1 text-muted-foreground">
            {order.receivingAddress.label} · {order.receivingAddress.contactName} ·{' '}
            {order.receivingAddress.contactPhone}
          </p>
          <p className="mt-1">{order.receivingAddress.address}</p>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('product')}</TableHead>
              <TableHead>{t('sku')}</TableHead>
              <TableHead className="text-right">{t('ordered')}</TableHead>
              <TableHead className="text-right">{t('received')}</TableHead>
              <TableHead className="text-right">{t('unitPrice')}</TableHead>
              <TableHead className="text-right">{t('lineTotal')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>{line.productName}</TableCell>
                <TableCell className="font-mono text-xs">{line.skuCode}</TableCell>
                <TableCell className="text-right tabular-nums">{line.quantityOrdered}</TableCell>
                <TableCell className="text-right tabular-nums">{line.quantityReceived}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCNY(line.unitWholesalePrice)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCNY(line.lineTotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {order.status === 'PENDING_PAYMENT' && order.mockPayment ? (
          <>
            <Button className="min-h-11" disabled={paying} onClick={handlePay}>
              {paying ? '…' : t('pay')}
            </Button>
            <p className="self-center text-sm text-muted-foreground">{t('mockPaymentHint')}</p>
          </>
        ) : null}
        {order.status === 'SHIPPED' ? (
          <Button className="min-h-11" disabled={confirming} onClick={handleConfirm}>
            {confirming ? '…' : t('confirmReceipt')}
          </Button>
        ) : null}
        <Button variant="outline" className="min-h-11" asChild>
          <Link href="/inventory/procurement/history">{t('historyTitle')}</Link>
        </Button>
      </div>
    </div>
  );
}
