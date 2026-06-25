'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, Dialog, DialogCloseButton, Label, Select } from '@meridian/ui';

import type { PlatformDistributor } from '@/lib/api';

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (recruitedByDistributorId?: string) => void;
  distributors?: PlatformDistributor[];
}

export function ApproveDialog({
  open,
  onOpenChange,
  onConfirm,
  distributors = [],
}: ApproveDialogProps) {
  const t = useTranslations('admin.merchants');
  const tc = useTranslations('common');
  const [recruitedByDistributorId, setRecruitedByDistributorId] = useState('');

  function handleConfirm() {
    onConfirm(recruitedByDistributorId || undefined);
    setRecruitedByDistributorId('');
  }

  function handleOpenChange(next: boolean) {
    if (!next) setRecruitedByDistributorId('');
    onOpenChange(next);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t('approveTitle')}
      description={t('approveDescription')}
      footer={
        <>
          <DialogCloseButton onClick={() => handleOpenChange(false)}>{tc('cancel')}</DialogCloseButton>
          <Button onClick={handleConfirm}>{t('approve')}</Button>
        </>
      }
    >
      {distributors.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="recruited-by">{t('recruitedBy')}</Label>
          <Select
            id="recruited-by"
            value={recruitedByDistributorId}
            onChange={(e) => setRecruitedByDistributorId(e.target.value)}
          >
            <option value="">{t('recruitedByNone')}</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
    </Dialog>
  );
}
