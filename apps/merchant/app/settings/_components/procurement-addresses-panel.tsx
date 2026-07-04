'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from '@meridian/ui';
import type { ProcurementReceivingAddress } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface ProcurementAddressesPanelProps {
  addresses: ProcurementReceivingAddress[];
  isOwner: boolean;
  token: string;
}

interface AddressFormState {
  label: string;
  contactName: string;
  contactPhone: string;
  address: string;
  isDefault: boolean;
}

const emptyForm = (): AddressFormState => ({
  label: '',
  contactName: '',
  contactPhone: '',
  address: '',
  isDefault: false,
});

export function ProcurementAddressesPanel({
  addresses: initial,
  isOwner,
  token,
}: ProcurementAddressesPanelProps) {
  const router = useRouter();
  const t = useTranslations('merchant.settings.procurementAddresses');
  const tCommon = useTranslations('common');
  const [addresses, setAddresses] = useState(initial);
  useEffect(() => {
    setAddresses(initial);
  }, [initial]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormState>(emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function startCreate() {
    setEditingId(null);
    setForm({ ...emptyForm(), isDefault: addresses.length === 0 });
    setShowForm(true);
    setError('');
  }

  function startEdit(address: ProcurementReceivingAddress) {
    setEditingId(address.id);
    setForm({
      label: address.label,
      contactName: address.contactName,
      contactPhone: address.contactPhone,
      address: address.address,
      isDefault: address.isDefault,
    });
    setShowForm(true);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await apiFetch(
          `/merchant/settings/procurement-addresses/${editingId}`,
          { method: 'PATCH', body: JSON.stringify(form) },
          token,
        );
      } else {
        await apiFetch(
          '/merchant/settings/procurement-addresses',
          { method: 'POST', body: JSON.stringify(form) },
          token,
        );
      }
      setShowForm(false);
      setForm(emptyForm());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(id: string) {
    if (!isOwner) return;
    setError('');
    try {
      await apiFetch(
        `/merchant/settings/procurement-addresses/${id}/set-default`,
        { method: 'POST' },
        token,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('errors.saveFailed'));
    }
  }

  async function handleRemove(id: string) {
    if (!isOwner) return;
    setError('');
    try {
      await apiFetch(
        `/merchant/settings/procurement-addresses/${id}`,
        { method: 'DELETE' },
        token,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('removeFailed'));
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>{t('title')}</CardTitle>
        {isOwner ? (
          <Button type="button" size="sm" onClick={startCreate}>
            {t('add')}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('description')}</p>
        {!isOwner ? <p className="text-sm text-muted-foreground">{t('ownerOnly')}</p> : null}

        {addresses.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ul className="space-y-3">
            {addresses.map((address) => (
              <li
                key={address.id}
                className="rounded-xl border border-border p-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{address.label}</span>
                      {address.isDefault ? (
                        <Badge variant="secondary">{t('defaultBadge')}</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {address.contactName} · {address.contactPhone}
                    </p>
                    <p className="mt-1">{address.address}</p>
                  </div>
                  {isOwner ? (
                    <div className="flex flex-wrap gap-2">
                      {!address.isDefault ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetDefault(address.id)}
                        >
                          {t('setDefault')}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(address)}
                      >
                        {tCommon('edit')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemove(address.id)}
                      >
                        {tCommon('delete')}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}

        {showForm && isOwner ? (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border p-4">
            <div className="space-y-2">
              <Label htmlFor="addr-label">{t('label')}</Label>
              <Input
                id="addr-label"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                required
                className="min-h-11"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addr-contact">{t('contactName')}</Label>
                <Input
                  id="addr-contact"
                  value={form.contactName}
                  onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                  required
                  className="min-h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-phone">{t('contactPhone')}</Label>
                <Input
                  id="addr-phone"
                  value={form.contactPhone}
                  onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                  required
                  className="min-h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-line">{t('address')}</Label>
              <Textarea
                id="addr-line"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                required
                rows={2}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              />
              {t('setAsDefault')}
            </label>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="min-h-11">
                {saving ? '…' : tCommon('save')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => setShowForm(false)}
              >
                {tCommon('cancel')}
              </Button>
            </div>
          </form>
        ) : null}

        {error && !showForm ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
