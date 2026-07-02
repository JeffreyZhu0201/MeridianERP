'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  BentoDetailHero,
  Button,
  DetailPageFrame,
  Dialog,
  DialogCloseButton,
  Input,
  Label,
  Textarea,
} from '@meridian/ui';
import type { Warehouse } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface WarehouseDetailProps {
  warehouse: Warehouse;
  token: string;
}

export function WarehouseDetail({ warehouse: initial, token }: WarehouseDetailProps) {
  const router = useRouter();
  const t = useTranslations('merchant.inventory.warehouses');
  const tc = useTranslations('common');
  const [warehouse, setWarehouse] = useState(initial);
  const [editOpen, setEditOpen] = useState(false);
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [form, setForm] = useState({ name: warehouse.name, address: warehouse.address ?? '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      await apiFetch(`/merchant/inventory/warehouses/${warehouse.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name,
          address: form.address || null,
        }),
      }, token);
      setWarehouse((prev) => ({ ...prev, name: form.name, address: form.address || null }));
      setEditOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault() {
    try {
      await apiFetch(`/merchant/inventory/warehouses/${warehouse.id}/set-default`, {
        method: 'POST',
      }, token);
      setWarehouse((prev) => ({ ...prev, isDefault: true }));
      setDefaultOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('setDefaultFailed'));
    }
  }

  return (
    <>
      <DetailPageFrame
        title={warehouse.name}
        backHref="/inventory/warehouses"
        backLabel={t('backLabel')}
        badges={
          <>
            {warehouse.isDefault && <Badge variant="outline">{t('defaultBadge')}</Badge>}
            <Badge variant={warehouse.isActive ? 'success' : 'secondary'}>
              {warehouse.isActive ? tc('active') : tc('inactive')}
            </Badge>
          </>
        }
        actions={
          <>
            {!warehouse.isDefault && (
              <Button variant="outline" onClick={() => setDefaultOpen(true)}>
                {t('setDefault')}
              </Button>
            )}
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              {tc('edit')}
            </Button>
          </>
        }
      >
        {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

        <BentoDetailHero
          metrics={[
            { title: t('address'), value: warehouse.address ?? '—' },
            { title: t('createdAt'), value: new Date(warehouse.createdAt).toLocaleDateString() },
          ]}
        />
      </DetailPageFrame>

      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={tc('edit')}
        footer={
          <>
            <DialogCloseButton onClose={() => setEditOpen(false)}>{tc('cancel')}</DialogCloseButton>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? tc('loading') : tc('save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wh-name">{t('name')}</Label>
            <Input
              id="wh-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wh-address">{t('address')}</Label>
            <Textarea
              id="wh-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </Dialog>

      <Dialog
        open={defaultOpen}
        onOpenChange={setDefaultOpen}
        title={t('setDefaultTitle')}
        description={t('setDefaultDescription', { name: warehouse.name })}
        footer={
          <>
            <DialogCloseButton onClose={() => setDefaultOpen(false)}>{tc('cancel')}</DialogCloseButton>
            <Button onClick={handleSetDefault}>{tc('confirm')}</Button>
          </>
        }
      />
    </>
  );
}
