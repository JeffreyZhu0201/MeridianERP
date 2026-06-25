"use client";

import * as React from "react";
import { ScanLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

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

/**
 * Branch staff verifies in-store pickup via 6-digit code or camera QR scan.
 * Input OTP pattern from Advanced Components showcase.
 */
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
  const [code, setCode] = React.useState("");

  React.useEffect(() => {
    if (!open) setCode("");
  }, [open]);

  const canSubmit = code.length === 6 && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify pickup</DialogTitle>
          <DialogDescription>
            Confirm the customer&apos;s 6-digit code or scan their QR before
            handing over goods.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Order</dt>
            <dd className="font-mono text-xs">{orderId.slice(0, 12)}…</dd>
            <dt className="text-muted-foreground">Customer</dt>
            <dd>{customerLabel}</dd>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="tabular-nums font-medium">{total}</dd>
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

        <DialogFooter>
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
            {isSubmitting ? "Verifying…" : "Confirm pickup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
