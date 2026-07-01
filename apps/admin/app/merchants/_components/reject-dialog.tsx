'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Dialog, DialogCloseButton, Label, Textarea } from '@meridian/ui';

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

export function RejectDialog({ open, onOpenChange, onConfirm }: RejectDialogProps) {
  const t = useTranslations('admin.merchants');
  const tc = useTranslations('common');
  const [reason, setReason] = useState('');

  function handleClose() {
    setReason('');
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && handleClose()}
      title={t('rejectTitle')}
      description={t('rejectDescription')}
      footer={
        <>
          <DialogCloseButton onClose={handleClose}>{tc('cancel')}</DialogCloseButton>
          <Button
            variant="destructive"
            disabled={!reason.trim()}
            onClick={() => {
              onConfirm(reason.trim());
              setReason('');
            }}
          >
            {t('reject')}
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <Label htmlFor="rejection-reason">{t('rejectReason')}</Label>
        <Textarea
          id="rejection-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('rejectReasonPlaceholder')}
          required
        />
      </div>
    </Dialog>
  );
}
