'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogCloseButton,
  Input,
  Label,
  Select,
} from '@meridian/ui';

import type { PlatformDistributorSummary } from '@meridian/shared';

import {
  apiFetch,
  type PaginatedResponse,
  type PlatformAccountListItem,
} from '@/lib/api';

interface CreateDistributorFormProps {
  token: string;
}

export function CreateDistributorForm({ token }: CreateDistributorFormProps) {
  const router = useRouter();
  const t = useTranslations('admin.distributors');
  const tu = useTranslations('admin.users');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [accountId, setAccountId] = useState('');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [selectedOwnerEmail, setSelectedOwnerEmail] = useState('');
  const [ownerOptions, setOwnerOptions] = useState<PlatformAccountListItem[]>([]);
  const [name, setName] = useState('');
  const [commissionRate, setCommissionRate] = useState('10');
  const [commissionType, setCommissionType] = useState<'PERCENT' | 'FIXED'>('PERCENT');

  useEffect(() => {
    if (!ownerSearch.trim()) {
      setOwnerOptions([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await apiFetch<PaginatedResponse<PlatformAccountListItem>>(
          `/platform/users?search=${encodeURIComponent(ownerSearch.trim())}&limit=10`,
          {},
          token,
        );
        setOwnerOptions(res.data);
      } catch {
        setOwnerOptions([]);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [ownerSearch, token]);

  function resetForm() {
    setAccountId('');
    setOwnerSearch('');
    setSelectedOwnerEmail('');
    setName('');
    setCommissionRate('10');
    setCommissionType('PERCENT');
  }

  async function handleSubmit() {
    if (!accountId) {
      setError(t('form.accountRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const created = await apiFetch<PlatformDistributorSummary>(
        '/platform/distributors',
        {
          method: 'POST',
          body: JSON.stringify({
            accountId,
            name: name.trim() || undefined,
            commissionRate: Number(commissionRate),
            commissionType,
          }),
        },
        token,
      );
      setOpen(false);
      resetForm();
      router.push(`/distributors/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = Boolean(accountId);

  return (
    <>
      <Button onClick={() => setOpen(true)}>{t('create')}</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={t('createTitle')}
        footer={
          <>
            <DialogCloseButton onClose={() => setOpen(false)}>{tc('cancel')}</DialogCloseButton>
            <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
              {submitting ? t('form.submitting') : t('form.submit')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="space-y-2">
            <Label htmlFor="promoter-user">{t('form.selectUser')}</Label>
            <Input
              id="promoter-user"
              placeholder={tu('searchPlaceholder')}
              value={ownerSearch}
              onChange={(e) => {
                setOwnerSearch(e.target.value);
                setAccountId('');
                setSelectedOwnerEmail('');
              }}
            />
            {ownerOptions.length > 0 && !accountId ? (
              <ul className="max-h-40 overflow-y-auto rounded-md border text-sm">
                {ownerOptions.map((account) => (
                  <li key={account.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-muted"
                      onClick={() => {
                        setAccountId(account.id);
                        setSelectedOwnerEmail(account.email);
                        setOwnerSearch(account.email);
                        const display =
                          [account.firstName, account.lastName].filter(Boolean).join(' ') ||
                          account.email.split('@')[0];
                        setName(display);
                      }}
                    >
                      {account.email}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {accountId ? (
              <p className="text-xs text-muted-foreground">
                {t('form.selectedUser')}: {selectedOwnerEmail}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dist-name">{t('form.name')}</Label>
            <Input
              id="dist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('form.nameOptional')}
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
