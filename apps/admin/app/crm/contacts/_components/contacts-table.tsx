'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { PlatformCrmCompany, PlatformCrmContact } from '@meridian/shared';
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

import { apiFetch } from '@/lib/api';

export function ContactsTable({
  contacts: initial,
  companies,
  token,
}: {
  contacts: PlatformCrmContact[];
  companies: PlatformCrmCompany[];
  token: string;
}) {
  const t = useTranslations('admin.crm.contacts');
  const tc = useTranslations('common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformCrmContact | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyId: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm({ firstName: '', lastName: '', email: '', phone: '', companyId: '' });
    setError('');
    setOpen(true);
  }

  function openEdit(contact: PlatformCrmContact) {
    setEditing(contact);
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      companyId: contact.companyId ?? '',
    });
    setError('');
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const body = JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        companyId: form.companyId || undefined,
      });
      if (editing) {
        await apiFetch(`/platform/crm/contacts/${editing.id}`, { method: 'PATCH', body }, token);
      } else {
        await apiFetch('/platform/crm/contacts', { method: 'POST', body }, token);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return;
    await apiFetch(`/platform/crm/contacts/${id}`, { method: 'DELETE' }, token);
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>{t('add')}</Button>
      </div>

      {initial.length === 0 ? (
        <div className="rounded-xl ring-1 ring-border p-12 text-center text-muted-foreground">
          {t('empty')}
        </div>
      ) : (
        <div className="rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('firstName')}</TableHead>
                <TableHead>{t('lastName')}</TableHead>
                <TableHead>{tc('email')}</TableHead>
                <TableHead>{tc('phone')}</TableHead>
                <TableHead>{t('company')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initial.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.firstName}</TableCell>
                  <TableCell>{contact.lastName}</TableCell>
                  <TableCell>{contact.email ?? '—'}</TableCell>
                  <TableCell>{contact.phone ?? '—'}</TableCell>
                  <TableCell>{contact.company?.name ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(contact)}>
                        {tc('edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(contact.id)}
                      >
                        {tc('delete')}
                      </Button>
                    </div>
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
            <DialogCloseButton onClose={() => setOpen(false)}>{tc('cancel')}</DialogCloseButton>
            <Button
              onClick={handleSave}
              disabled={saving || !form.firstName.trim() || !form.lastName.trim()}
            >
              {tc('save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-first">{t('firstName')}</Label>
              <Input
                id="contact-first"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-last">{t('lastName')}</Label>
              <Input
                id="contact-last"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">{tc('email')}</Label>
            <Input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">{tc('phone')}</Label>
            <Input
              id="contact-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-company">{t('company')}</Label>
            <Select
              id="contact-company"
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            >
              <option value="">{tc('none')}</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </Dialog>
    </>
  );
}
