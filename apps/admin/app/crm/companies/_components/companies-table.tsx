'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { PlatformCrmCompany } from '@meridian/shared';
import {
  Button,
  Dialog,
  DialogCloseButton,
  EmptyState,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';

import { apiFetch } from '@/lib/api';

export function CompaniesTable({
  companies: initial,
  token,
}: {
  companies: PlatformCrmCompany[];
  token: string;
}) {
  const t = useTranslations('admin.crm.companies');
  const tc = useTranslations('common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformCrmCompany | null>(null);
  const [form, setForm] = useState({ name: '', website: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', website: '' });
    setError('');
    setOpen(true);
  }

  function openEdit(company: PlatformCrmCompany) {
    setEditing(company);
    setForm({ name: company.name, website: company.website ?? '' });
    setError('');
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const body = JSON.stringify({
        name: form.name,
        website: form.website || undefined,
      });
      if (editing) {
        await apiFetch(`/platform/crm/companies/${editing.id}`, { method: 'PATCH', body }, token);
      } else {
        await apiFetch('/platform/crm/companies', { method: 'POST', body }, token);
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
    await apiFetch(`/platform/crm/companies/${id}`, { method: 'DELETE' }, token);
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>{t('add')}</Button>
      </div>

      {initial.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <div className="rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tc('name')}</TableHead>
                <TableHead>{t('website')}</TableHead>
                <TableHead>{t('contacts')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initial.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/crm/companies/${company.id}`}
                      className="text-primary hover:underline"
                    >
                      {company.name}
                    </Link>
                  </TableCell>
                  <TableCell>{company.website ?? '—'}</TableCell>
                  <TableCell>{company._count?.contacts ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(company)}>
                        {tc('edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(company.id)}
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
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {tc('save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">{tc('name')}</Label>
            <Input
              id="company-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-website">{t('website')}</Label>
            <Input
              id="company-website"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </Dialog>
    </>
  );
}
