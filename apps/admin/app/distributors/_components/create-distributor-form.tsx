'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogCloseButton,
  Input,
  Label,
  Select,
} from '@meridian/ui';

import { apiFetch } from '@/lib/api';

interface CreateDistributorFormProps {
  token: string;
}

export function CreateDistributorForm({ token }: CreateDistributorFormProps) {
  const router = useRouter();
  const t = useTranslations('admin.distributors');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [commissionRate, setCommissionRate] = useState('10');
  const [commissionType, setCommissionType] = useState<'PERCENT' | 'FIXED'>('PERCENT');

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(
        '/platform/distributors',
        {
          method: 'POST',
          body: JSON.stringify({
            name,
            email: email || undefined,
            phone: phone || undefined,
            commissionRate: Number(commissionRate),
            commissionType,
          }),
        },
        token,
      );
      setOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setCommissionRate('10');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>{t('create')}</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={t('createTitle')}
        footer={
          <>
            <DialogCloseButton onClick={() => setOpen(false)}>{tc('cancel')}</DialogCloseButton>
            <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
              {submitting ? t('form.submitting') : t('form.submit')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="space-y-2">
            <Label htmlFor="dist-name">{t('form.name')}</Label>
            <Input
              id="dist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dist-email">{t('form.email')}</Label>
            <Input
              id="dist-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dist-phone">{t('form.phone')}</Label>
            <Input
              id="dist-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dist-rate">{t('form.commissionRate')}</Label>
              <Input
                id="dist-rate"
                type="number"
                min="0"
                step="0.01"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dist-type">{t('form.commissionType')}</Label>
              <Select
                id="dist-type"
                value={commissionType}
                onChange={(e) => setCommissionType(e.target.value as 'PERCENT' | 'FIXED')}
              >
                <option value="PERCENT">{t('form.percent')}</option>
                <option value="FIXED">{t('form.fixed')}</option>
              </Select>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
