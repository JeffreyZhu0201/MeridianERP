'use client';

import { useEffect, useState } from 'react';
import type {
  CreateCustomerDeliveryAddressBody,
  CustomerDeliveryAddressRow,
  UpdateCustomerDeliveryAddressBody,
} from '@meridian/shared';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export interface StoreAddressFormLabels {
  titleAdd: string;
  titleEdit: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: string;
  save: string;
  cancel: string;
}

export interface StoreAddressFormProps {
  open: boolean;
  initial?: CustomerDeliveryAddressRow | null;
  labels: StoreAddressFormLabels;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    body: CreateCustomerDeliveryAddressBody | UpdateCustomerDeliveryAddressBody,
  ) => Promise<void>;
  loading?: boolean;
}

const emptyForm = {
  label: '',
  name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  province: '',
  postalCode: '',
  isDefault: false,
};

export function StoreAddressForm({
  open,
  initial,
  labels,
  onOpenChange,
  onSubmit,
  loading = false,
}: StoreAddressFormProps) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        label: initial.label ?? '',
        name: initial.name,
        phone: initial.phone,
        line1: initial.line1,
        line2: initial.line2 ?? '',
        city: initial.city,
        province: initial.province ?? '',
        postalCode: initial.postalCode ?? '',
        isDefault: initial.isDefault,
      });
      return;
    }
    setForm(emptyForm);
  }, [open, initial]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await onSubmit({
      label: form.label || undefined,
      name: form.name,
      phone: form.phone,
      line1: form.line1,
      line2: form.line2 || undefined,
      city: form.city,
      province: form.province || undefined,
      postalCode: form.postalCode || undefined,
      isDefault: form.isDefault,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? labels.titleEdit : labels.titleAdd}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {labels.cancel}
          </Button>
          <Button type="submit" form="store-address-form" disabled={loading}>
            {labels.save}
          </Button>
        </>
      }
    >
      <form id="store-address-form" className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="address-label">{labels.label}</Label>
          <Input
            id="address-label"
            value={form.label}
            onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="address-name">{labels.name}</Label>
            <Input
              id="address-name"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address-phone">{labels.phone}</Label>
            <Input
              id="address-phone"
              required
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-line1">{labels.line1}</Label>
          <Input
            id="address-line1"
            required
            value={form.line1}
            onChange={(e) => setForm((prev) => ({ ...prev, line1: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-line2">{labels.line2}</Label>
          <Input
            id="address-line2"
            value={form.line2}
            onChange={(e) => setForm((prev) => ({ ...prev, line2: e.target.value }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="address-city">{labels.city}</Label>
            <Input
              id="address-city"
              required
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address-province">{labels.province}</Label>
            <Input
              id="address-province"
              value={form.province}
              onChange={(e) => setForm((prev) => ({ ...prev, province: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address-postal">{labels.postalCode}</Label>
            <Input
              id="address-postal"
              value={form.postalCode}
              onChange={(e) => setForm((prev) => ({ ...prev, postalCode: e.target.value }))}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
          />
          {labels.isDefault}
        </label>
      </form>
    </Dialog>
  );
}
