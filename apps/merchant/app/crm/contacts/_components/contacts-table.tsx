'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Button,
  Input,
  Label,
  Sheet,
  SheetFooter,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';

import { apiFetch, type Contact } from '@/lib/api';

interface ContactsTableProps {
  contacts: Contact[];
  token: string;
}

export function ContactsTable({ contacts: initial, token }: ContactsTableProps) {
  const t = useTranslations('merchant.crm.contacts');
  const tc = useTranslations('common');
  const router = useRouter();
  const [contacts, setContacts] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [error, setError] = useState('');

  function openCreate() {
    setEditing(null);
    setForm({ firstName: '', lastName: '', email: '', phone: '' });
    setOpen(true);
  }

  function openEdit(contact: Contact) {
    setEditing(contact);
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
    });
    setOpen(true);
  }

  async function handleSave() {
    setError('');
    try {
      if (editing) {
        await apiFetch(
          `/merchant/contacts/${editing.id}`,
          { method: 'PATCH', body: JSON.stringify(form) },
          token,
        );
      } else {
        await apiFetch('/merchant/contacts', { method: 'POST', body: JSON.stringify(form) }, token);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc('errors.saveFailed'));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return;
    await apiFetch(`/merchant/contacts/${id}`, { method: 'DELETE' }, token);
    setContacts((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>{t('add')}</Button>
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-xl ring-1 ring-border p-12 text-center">
          <p className="text-muted-foreground">{t('empty')}</p>
          <Button className="mt-4" onClick={openCreate}>
            {t('emptyAction')}
          </Button>
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
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Link href={`/crm/contacts/${contact.id}`} className="hover:underline">
                      {contact.firstName}
                    </Link>
                  </TableCell>
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

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={editing ? t('editTitle') : t('addTitle')}
        footer={
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button onClick={handleSave}>{tc('save')}</Button>
          </SheetFooter>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">{t('firstName')}</Label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{t('lastName')}</Label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{tc('email')}</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{tc('phone')}</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </Sheet>
    </>
  );
}
