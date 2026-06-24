'use client';

import { Button, Dialog, DialogCloseButton } from '@meridian/ui';

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ApproveDialog({ open, onOpenChange, onConfirm }: ApproveDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Approve merchant"
      description="This will provision the tenant and activate the merchant account."
      footer={
        <>
          <DialogCloseButton onClick={() => onOpenChange(false)} />
          <Button
            onClick={() => {
              onConfirm();
            }}
          >
            Approve
          </Button>
        </>
      }
    />
  );
}
