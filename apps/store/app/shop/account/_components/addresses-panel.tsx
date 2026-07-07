'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  CreateCustomerDeliveryAddressBody,
  CustomerDeliveryAddressRow,
  UpdateCustomerDeliveryAddressBody,
} from '@meridian/shared';
import { StoreAddressForm, StoreAddressList } from '@meridian/ui';

import { apiFetch } from '@/lib/api';

export function AddressesPanel({
  initialAddresses,
  token,
}: {
  initialAddresses: CustomerDeliveryAddressRow[];
  token: string;
}) {
  const router = useRouter();
  const t = useTranslations('store.account.addresses');
  const [addresses, setAddresses] = useState(initialAddresses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerDeliveryAddressRow | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  async function refresh() {
    const next = await apiFetch<CustomerDeliveryAddressRow[]>(
      '/store/auth/addresses',
      {},
      token,
    );
    setAddresses(next);
    router.refresh();
  }

  async function handleSubmit(
    body: CreateCustomerDeliveryAddressBody | UpdateCustomerDeliveryAddressBody,
  ) {
    setFormLoading(true);
    try {
      if (editing) {
        await apiFetch<CustomerDeliveryAddressRow>(
          `/store/auth/addresses/${editing.id}`,
          { method: 'PATCH', body: JSON.stringify(body) },
          token,
        );
      } else {
        await apiFetch<CustomerDeliveryAddressRow>(
          '/store/auth/addresses',
          { method: 'POST', body: JSON.stringify(body) },
          token,
        );
      }
      setDialogOpen(false);
      setEditing(null);
      await refresh();
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setPendingId(id);
    try {
      await apiFetch(`/store/auth/addresses/${id}`, { method: 'DELETE' }, token);
      await refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function handleSetDefault(id: string) {
    setPendingId(id);
    try {
      await apiFetch<CustomerDeliveryAddressRow>(
        `/store/auth/addresses/${id}`,
        { method: 'PATCH', body: JSON.stringify({ isDefault: true }) },
        token,
      );
      await refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <StoreAddressList
        addresses={addresses}
        pendingId={pendingId}
        labels={{
          title: t('title'),
          add: t('add'),
          edit: t('edit'),
          remove: t('remove'),
          setDefault: t('setDefault'),
          defaultBadge: t('defaultBadge'),
          emptyTitle: t('emptyTitle'),
          emptyDescription: t('emptyDescription'),
        }}
        onAdd={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
        onEdit={(address) => {
          setEditing(address);
          setDialogOpen(true);
        }}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
      />
      <StoreAddressForm
        open={dialogOpen}
        initial={editing}
        loading={formLoading}
        labels={{
          titleAdd: t('formAdd'),
          titleEdit: t('formEdit'),
          label: t('label'),
          name: t('name'),
          phone: t('phone'),
          line1: t('line1'),
          line2: t('line2'),
          city: t('city'),
          province: t('province'),
          postalCode: t('postalCode'),
          isDefault: t('isDefault'),
          save: t('save'),
          cancel: t('cancel'),
        }}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
}
