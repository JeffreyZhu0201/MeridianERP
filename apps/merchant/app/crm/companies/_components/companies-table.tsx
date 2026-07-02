'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Button,
  EmptyState,
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

import { apiFetch, type Company } from '@/lib/api';

interface CompaniesTableProps {
  companies: Company[];
  token: string;
}

export function CompaniesTable({ companies: initial, token }: CompaniesTableProps) {
  const t = useTranslations('merchant.crm.companies');
  const tc = useTranslations('common');
  const router = useRouter();
  const [companies] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: '', website: '' });
  const [error, setError] = useState('');

  function openCreate() {
    setEditing(null);
    setForm({ name: '', website: '' });
    setOpen(true);
  }

  function openEdit(company: Company) {
    setEditing(company);
    setForm({ name: company.name, website: company.website ?? '' });
    setOpen(true);
  }

  async function handleSave() {
    setError('');
    try {
      if (editing) {
        await apiFetch(
          `/merchant/companies/${editing.id}`,
          { method: 'PATCH', body: JSON.stringify(form) },
          token,
        );
      } else {
        await apiFetch('/merchant/companies', { method: 'POST', body: JSON.stringify(form) }, token);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc('errors.saveFailed'));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return;
    await apiFetch(`/merchant/companies/${id}`, { method: 'DELETE' }, token);
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>{t('add')}</Button>
      </div>

      {companies.length === 0 ? (
        <EmptyState title={t('empty')} action={<Button onClick={openCreate}>{t('emptyAction')}</Button>} />
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
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">
                    <Link href={`/crm/companies/${company.id}`} className="hover:underline">
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
            <Label htmlFor="name">{tc('name')}</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">{t('website')}</Label>
            <Input
              id="website"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </Sheet>
    </>
  );
}
