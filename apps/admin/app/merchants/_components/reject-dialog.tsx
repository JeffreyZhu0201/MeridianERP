'use client';

import { useState } from 'react';
import { Button, Dialog, DialogCloseButton, Label, Textarea } from '@meridian/ui';

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

export function RejectDialog({ open, onOpenChange, onConfirm }: RejectDialogProps) {
  const [reason, setReason] = useState('');

  function handleClose() {
    setReason('');
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && handleClose()}
      title="Reject merchant"
      description="Provide a reason for rejection. The merchant will be notified."
      footer={
        <>
          <DialogCloseButton onClick={handleClose} />
          <Button
            variant="destructive"
            disabled={!reason.trim()}
            onClick={() => {
              onConfirm(reason.trim());
              setReason('');
            }}
          >
            Reject
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <Label htmlFor="rejection-reason">Rejection reason</Label>
        <Textarea
          id="rejection-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this application was rejected"
          required
        />
      </div>
    </Dialog>
  );
}
