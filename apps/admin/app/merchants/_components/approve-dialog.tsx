'use client';

import { useTranslations } from 'next-intl';
import { Button, Dialog, DialogCloseButton } from '@meridian/ui';

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ApproveDialog({ open, onOpenChange, onConfirm }: ApproveDialogProps) {
  const t = useTranslations('admin.merchants');
  const tc = useTranslations('common');

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('approveTitle')}
      description={t('approveDescription')}
      footer={
        <>
          <DialogCloseButton onClick={() => onOpenChange(false)}>{tc('cancel')}</DialogCloseButton>
          <Button
            onClick={() => {
              onConfirm();
            }}
          >
            {t('approve')}
          </Button>
        </>
      }
    />
  );
}
