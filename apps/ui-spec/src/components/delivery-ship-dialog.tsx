"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

/**
 * HQ ops confirms delivery ship — decrements MasterSku on confirm.
 * Alert Dialog pattern from Dialogs & Overlays showcase.
 */
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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Mark order shipped</AlertDialogTitle>
          <AlertDialogDescription>
            Factory inventory will decrease and the order will move to fulfilled.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

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
                  <span className="tabular-nums text-muted-foreground">
                    × {line.quantity}
                  </span>
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

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isSubmitting}
            onClick={(e) => {
              e.preventDefault();
              onConfirm?.();
            }}
          >
            {isSubmitting ? "Shipping…" : "Confirm ship"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
