'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Button,
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
      setError('Enter quantity for at least one line');
      return;
    }

    for (const line of lines) {
      const poLine = po.lines.find((l) => l.id === line.purchaseOrderLineId);
      if (poLine && line.quantityReceived > poLine.quantityRemaining) {
        setError(`Quantity exceeds remaining for ${poLine.variant.sku}`);
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
      setError(err instanceof Error ? err.message : 'Receive failed');
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
      setError(err instanceof Error ? err.message : 'Cancel failed');
    }
  }

  async function handleSubmit() {
    try {
      await apiFetch(`/merchant/inventory/purchase-orders/${po.id}/submit`, {
        method: 'POST',
      }, token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold tracking-tight">{po.poNumber}</h1>
            <PurchaseOrderStatusBadge status={po.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Supplier: {po.supplierName} · Warehouse: {po.warehouse.name}
            {po.orderedAt ? ` · Ordered ${new Date(po.orderedAt).toLocaleDateString()}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDraft ? (
            <Button onClick={handleSubmit}>Submit order</Button>
          ) : null}
          {canReceive ? (
            <Button onClick={openReceive}>Receive goods</Button>
          ) : null}
          {canCancel ? (
            <Button variant="destructive" onClick={() => setCancelOpen(true)}>
              Cancel PO
            </Button>
          ) : null}
        </div>
      </div>

      {error && !receiveOpen ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variant / SKU</TableHead>
              <TableHead className="text-right">Ordered</TableHead>
              <TableHead className="text-right">Received</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
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
          <h2 className="text-lg font-medium">Receive history</h2>
          <div className="space-y-2">
            {po.receipts.map((receipt) => (
              <div key={receipt.id} className="rounded-xl border p-4 text-sm">
                <p className="font-medium">
                  {new Date(receipt.createdAt).toLocaleString()} ·{' '}
                  {receipt.lines.reduce((s, l) => s + l.quantityReceived, 0)} units · by{' '}
                  {receipt.receivedBy.email}
                </p>
                {receipt.note ? (
                  <p className="mt-1 text-muted-foreground">Note: {receipt.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Dialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        title="Receive goods"
        footer={
          <>
            <DialogCloseButton onClick={() => setReceiveOpen(false)} />
            <Button onClick={handleReceive}>Confirm receive</Button>
          </>
        }
      >
        <div className="space-y-4">
          {po.lines.map((line) => (
            <div key={line.id} className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{line.variant.sku}</p>
                <p className="text-xs text-muted-foreground">
                  Remaining: {line.quantityRemaining}
                </p>
              </div>
              <div className="w-24 space-y-1">
                <Label htmlFor={`recv-${line.id}`}>Qty</Label>
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
            <Label htmlFor="recv-note">Note</Label>
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
        title={`Cancel ${po.poNumber}?`}
        description="This cannot be undone."
        footer={
          <>
            <DialogCloseButton onClick={() => setCancelOpen(false)} />
            <Button variant="destructive" onClick={handleCancel}>
              Cancel PO
            </Button>
          </>
        }
      />
    </div>
  );
}
