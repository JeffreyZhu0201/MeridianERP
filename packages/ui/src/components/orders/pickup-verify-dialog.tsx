'use client';

import * as React from 'react';
import { ScanLine } from 'lucide-react';

import { Button } from '../ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '../ui/input-otp';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';

export interface PickupVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  customerLabel: string;
  total: string;
  onVerify?: (code: string) => void;
  isSubmitting?: boolean;
  error?: string;
}

export function PickupVerifyDialog({
  open,
  onOpenChange,
  orderId,
  customerLabel,
  total,
  onVerify,
  isSubmitting,
  error,
}: PickupVerifyDialogProps) {
  const [code, setCode] = React.useState('');

  React.useEffect(() => {
    if (!open) setCode('');
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  const canSubmit = code.length === 6 && !isSubmitting;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => !isSubmitting && onOpenChange(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="pickup-verify-title"
        className={cn(
          'relative z-50 grid w-full max-w-md gap-4 rounded-xl bg-background p-6 ring-1 ring-border',
        )}
      >
        <div className="space-y-2">
          <h2 id="pickup-verify-title" className="text-lg font-semibold">
            Verify pickup
          </h2>
          <p className="text-sm text-muted-foreground">
            Confirm the customer&apos;s 6-digit code or scan their QR before handing over goods.
          </p>
        </div>

        <div className="space-y-4 py-2">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Order</dt>
            <dd className="font-mono text-xs">{orderId.slice(0, 12)}…</dd>
            <dt className="text-muted-foreground">Customer</dt>
            <dd>{customerLabel}</dd>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-medium tabular-nums">{total}</dd>
          </dl>

          <div className="space-y-3">
            <Label htmlFor="pickup-code">Pickup code</Label>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
              <InputOTP
                id="pickup-code"
                maxLength={6}
                value={code}
                onChange={setCode}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <Button type="button" variant="outline" className="min-h-11 shrink-0">
                <ScanLine className="mr-2 size-4" aria-hidden />
                Scan QR
              </Button>
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>
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
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => onVerify?.(code)}
          >
            {isSubmitting ? 'Verifying…' : 'Confirm pickup'}
          </Button>
        </div>
      </div>
    </div>
  );
}
