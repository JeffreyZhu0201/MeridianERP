'use client';

import Link from 'next/link';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import { CommissionType } from '@meridian/shared';

import { apiFetch, type Distributor } from '@/lib/api';

interface DistributorsTableProps {
  distributors: Distributor[];
  token: string;
}

export function DistributorsTable({ distributors, token }: DistributorsTableProps) {
  const router = useRouter();
  const t = useTranslations('merchant.distributors.table');
  const tCommon = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Distributor | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    commissionType: CommissionType.PERCENT,
    commissionRate: '10',
  });
  const [error, setError] = useState('');

  function openCreate() {
    setEditing(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      commissionType: CommissionType.PERCENT,
      commissionRate: '10',
    });
    setOpen(true);
  }

  function openEdit(d: Distributor) {
    setEditing(d);
    setForm({
      name: d.name,
      email: d.email ?? '',
      phone: d.phone ?? '',
      commissionType: d.commissionType as CommissionType,
      commissionRate: String(d.commissionRate),
    });
    setOpen(true);
  }

  async function handleSave() {
    setError('');
    const payload = {
      ...form,
      commissionRate: Number(form.commissionRate),
    };
    try {
      if (editing) {
        await apiFetch(
          `/merchant/distributors/${editing.id}`,
          { method: 'PATCH', body: JSON.stringify(payload) },
          token,
        );
      } else {
        await apiFetch('/merchant/distributors', { method: 'POST', body: JSON.stringify(payload) }, token);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('errors.saveFailed'));
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>{t('add')}</Button>
      </div>

      {distributors.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          {t('empty')}
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('name')}</TableHead>
                <TableHead>{tCommon('email')}</TableHead>
                <TableHead>{t('commission')}</TableHead>
                <TableHead>{tCommon('active')}</TableHead>
                <TableHead>{t('bindings')}</TableHead>
                <TableHead className="text-right">{tCommon('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distributors.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    <Link href={`/distributors/${d.id}`} className="text-primary hover:underline">
                      {d.name}
                    </Link>
                  </TableCell>
                  <TableCell>{d.email ?? '—'}</TableCell>
                  <TableCell>
                    {d.commissionRate}
                    {d.commissionType === CommissionType.PERCENT ? '%' : t('fixedSuffix')}
                  </TableCell>
                  <TableCell>{d.isActive ? tCommon('yes') : tCommon('no')}</TableCell>
                  <TableCell>{d._count?.bindings ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openEdit(d)}>
                      {tCommon('edit')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? t('editTitle') : t('addTitle')}
        footer={
          <>
            <DialogCloseButton onClick={() => setOpen(false)} />
            <Button onClick={handleSave}>{tCommon('save')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{tCommon('name')}</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{tCommon('email')}</Label>
            <Input id="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{tCommon('phone')}</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commissionType">{t('commissionType')}</Label>
            <Select
              id="commissionType"
              value={form.commissionType}
              onChange={(e) => setForm({ ...form, commissionType: e.target.value as CommissionType })}
            >
              <option value={CommissionType.PERCENT}>{t('percent')}</option>
              <option value={CommissionType.FIXED}>{t('fixed')}</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="commissionRate">{t('commissionRate')}</Label>
            <Input
              id="commissionRate"
              type="number"
              value={form.commissionRate}
              onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </Dialog>
    </>
  );
}
