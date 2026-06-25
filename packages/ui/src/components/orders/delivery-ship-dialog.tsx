'use client';

import * as React from 'react';

import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export interface DeliveryShipLine {
  productName: string;
  quantity: number;
  skuCode?: string;
}

export interface DeliveryShipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  branchName: string;
  customerLabel: string;
  addressSummary: string;
  lines: DeliveryShipLine[];
  onConfirm?: () => void;
  isSubmitting?: boolean;
  stockWarning?: string;
}

export function DeliveryShipDialog({
  open,
  onOpenChange,
  orderId,
  branchName,
  customerLabel,
  addressSummary,
  lines,
  onConfirm,
  isSubmitting,
  stockWarning,
}: DeliveryShipDialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => !isSubmitting && onOpenChange(false)}
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-modal
        aria-labelledby="delivery-ship-title"
        className={cn(
          'relative z-50 grid w-full max-w-lg gap-4 rounded-xl bg-background p-6 ring-1 ring-border',
        )}
      >
        <div className="space-y-2">
          <h2 id="delivery-ship-title" className="text-lg font-semibold">
            Mark order shipped
          </h2>
          <p className="text-sm text-muted-foreground">
            Factory inventory will decrease and the order will move to fulfilled. This action
            cannot be undone.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-muted-foreground">Order</dt>
            <dd className="font-mono text-xs">{orderId.slice(0, 12)}…</dd>
            <dt className="text-muted-foreground">Branch</dt>
            <dd>{branchName}</dd>
            <dt className="text-muted-foreground">Customer</dt>
            <dd>{customerLabel}</dd>
            <dt className="text-muted-foreground">Ship to</dt>
            <dd className="text-xs leading-relaxed">{addressSummary}</dd>
          </dl>

          <div className="rounded-lg ring-1 ring-border">
            <ul className="divide-y divide-border">
              {lines.map((line, i) => (
                <li
                  key={`${line.productName}-${i}`}
                  className="flex items-center justify-between gap-4 px-3 py-2"
                >
                  <span>
                    {line.productName}
                    {line.skuCode ? (
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {line.skuCode}
                      </span>
                    ) : null}
                  </span>
                  <span className="tabular-nums text-muted-foreground">× {line.quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          {stockWarning ? (
            <p className="text-sm text-amber-600 dark:text-amber-500" role="alert">
              {stockWarning}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={() => onConfirm?.()}>
            {isSubmitting ? 'Shipping…' : 'Confirm ship'}
          </Button>
        </div>
      </div>
    </div>
  );
}
