'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Button,
  DetailPageFrame,
  Dialog,
  DialogCloseButton,
  Input,
  Label,
  PurchaseOrderStatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@meridian/ui';
import { PurchaseOrderStatus } from '@meridian/shared';
import type { PurchaseOrderWithDetails } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface PurchaseOrderDetailProps {
  purchaseOrder: PurchaseOrderWithDetails;
  token: string;
}

export function PurchaseOrderDetail({ purchaseOrder: po, token }: PurchaseOrderDetailProps) {
  const router = useRouter();
  const t = useTranslations('merchant.inventory.purchaseOrders.detail');
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, string>>({});
  const [receiveNote, setReceiveNote] = useState('');
  const [error, setError] = useState('');

  const canReceive =
    po.status === PurchaseOrderStatus.ORDERED ||
    po.status === PurchaseOrderStatus.PARTIALLY_RECEIVED;

  const totalReceived = po.lines.reduce((sum, l) => sum + l.quantityReceived, 0);
  const canCancel =
    (po.status === PurchaseOrderStatus.DRAFT || po.status === PurchaseOrderStatus.ORDERED) &&
    totalReceived === 0;

  const isDraft = po.status === PurchaseOrderStatus.DRAFT;

  const description = po.orderedAt
    ? t('descriptionOrdered', {
        supplier: po.supplierName,
        warehouse: po.warehouse.name,
        date: new Date(po.orderedAt).toLocaleDateString(),
      })
    : t('description', {
        supplier: po.supplierName,
        warehouse: po.warehouse.name,
      });

  function openReceive() {
    const initial: Record<string, string> = {};
    for (const line of po.lines) {
      initial[line.id] = '';
    }
    setReceiveQtys(initial);
    setReceiveNote('');
    setError('');
    setReceiveOpen(true);
  }

  async function handleReceive() {
    setError('');
    const lines = po.lines
      .map((line) => ({
        purchaseOrderLineId: line.id,
        quantityReceived: parseInt(receiveQtys[line.id] ?? '0', 10) || 0,
      }))
      .filter((l) => l.quantityReceived > 0);

    if (lines.length === 0) {
      setError(t('minQtyError'));
      return;
    }

    for (const line of lines) {
      const poLine = po.lines.find((l) => l.id === line.purchaseOrderLineId);
      if (poLine && line.quantityReceived > poLine.quantityRemaining) {
        setError(t('exceedsRemaining', { sku: poLine.variant.sku }));
        return;
      }
    }

    try {
      await apiFetch(`/merchant/inventory/purchase-orders/${po.id}/receive`, {
        method: 'POST',
        body: JSON.stringify({ note: receiveNote || undefined, lines }),
      }, token);
      setReceiveOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('receiveFailed'));
    }
  }

  async function handleCancel() {
    try {
      await apiFetch(`/merchant/inventory/purchase-orders/${po.id}/cancel`, {
        method: 'POST',
      }, token);
      setCancelOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cancelFailed'));
    }
  }

  async function handleSubmit() {
    try {
      await apiFetch(`/merchant/inventory/purchase-orders/${po.id}/submit`, {
        method: 'POST',
      }, token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('submitFailed'));
    }
  }

  return (
    <>
      <DetailPageFrame
        title={po.poNumber}
        description={description}
        backHref="/inventory/purchase-orders"
        backLabel={t('backLabel')}
        badges={<PurchaseOrderStatusBadge status={po.status} />}
        actions={
          <>
            {isDraft ? <Button onClick={handleSubmit}>{t('submitOrder')}</Button> : null}
            {canReceive ? <Button onClick={openReceive}>{t('receiveGoods')}</Button> : null}
            {canCancel ? (
              <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                {t('cancelPo')}
              </Button>
            ) : null}
          </>
        }
      >
        {error && !receiveOpen ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('variantSku')}</TableHead>
              <TableHead className="text-right">{t('ordered')}</TableHead>
              <TableHead className="text-right">{t('received')}</TableHead>
              <TableHead className="text-right">{t('remaining')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {po.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>
                  <div>{line.variant.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{line.variant.sku}</div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {line.quantityOrdered}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {line.quantityReceived}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {line.quantityRemaining}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {po.receipts.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-medium">{t('receiveHistory')}</h2>
          <div className="space-y-2">
            {po.receipts.map((receipt) => (
              <div key={receipt.id} className="rounded-xl border p-4 text-sm">
                <p className="font-medium">
                  {t('receiptSummary', {
                    date: new Date(receipt.createdAt).toLocaleString(),
                    units: receipt.lines.reduce((s, l) => s + l.quantityReceived, 0),
                    email: receipt.receivedBy.email,
                  })}
                </p>
                {receipt.note ? (
                  <p className="mt-1 text-muted-foreground">
                    {t('notePrefix')} {receipt.note}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      </DetailPageFrame>

      <Dialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        title={t('receiveTitle')}
        footer={
          <>
            <DialogCloseButton onClick={() => setReceiveOpen(false)} />
            <Button onClick={handleReceive}>{t('confirmReceive')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {po.lines.map((line) => (
            <div key={line.id} className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{line.variant.sku}</p>
                <p className="text-xs text-muted-foreground">
                  {t('remainingLabel', { count: line.quantityRemaining })}
                </p>
              </div>
              <div className="w-24 space-y-1">
                <Label htmlFor={`recv-${line.id}`}>{t('qty')}</Label>
                <Input
                  id={`recv-${line.id}`}
                  type="number"
                  min={0}
                  max={line.quantityRemaining}
                  inputMode="numeric"
                  value={receiveQtys[line.id] ?? ''}
                  onChange={(e) =>
                    setReceiveQtys((prev) => ({ ...prev, [line.id]: e.target.value }))
                  }
                />
              </div>
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="recv-note">{t('note')}</Label>
            <Textarea
              id="recv-note"
              value={receiveNote}
              onChange={(e) => setReceiveNote(e.target.value)}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert" aria-live="polite">
              {error}
            </p>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t('cancelTitle', { poNumber: po.poNumber })}
        description={t('cancelDescription')}
        footer={
          <>
            <DialogCloseButton onClick={() => setCancelOpen(false)} />
            <Button variant="destructive" onClick={handleCancel}>
              {t('cancelPo')}
            </Button>
          </>
        }
      />
    </>
  );
}
