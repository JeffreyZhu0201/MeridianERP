'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  BentoDetailHero,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DetailPageFrame,
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

import { apiFetch, type Company, type Contact } from '@/lib/api';

interface CompanyDetailProps {
  company: Company;
  contacts: Contact[];
  token: string;
}

export function CompanyDetail({ company, contacts, token }: CompanyDetailProps) {
  const router = useRouter();
  const t = useTranslations('merchant.crm.companies');
  const tc = useTranslations('common');
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: company.name, website: company.website ?? '' });
  const [error, setError] = useState('');

  function openEdit() {
    setForm({ name: company.name, website: company.website ?? '' });
    setError('');
    setEditOpen(true);
  }

  async function handleSave() {
    setError('');
    try {
      await apiFetch(`/merchant/companies/${company.id}`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      }, token);
      setEditOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc('errors.saveFailed'));
    }
  }

  const emptyDash = tc('emptyDash');

  return (
    <>
      <DetailPageFrame
        title={company.name}
        backHref="/crm/companies"
        backLabel={t('title')}
        actions={<Button onClick={openEdit}>{tc('edit')}</Button>}
      >
        <BentoDetailHero
          metrics={[
            { title: t('contacts'), value: contacts.length },
            { title: t('website'), value: company.website ?? emptyDash },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>{t('detail.profile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{tc('name')}</span>
              <span>{company.name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('website')}</span>
              <span>{company.website ?? emptyDash}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('contacts')}</span>
              <span>{contacts.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('detail.linkedContacts')}</CardTitle>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <EmptyState title={t('detail.noContacts')} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('detail.contactName')}</TableHead>
                    <TableHead>{t('detail.email')}</TableHead>
                    <TableHead>{t('detail.phone')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <Link
                          href={`/crm/contacts/${contact.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {contact.firstName} {contact.lastName}
                        </Link>
                      </TableCell>
                      <TableCell>{contact.email ?? emptyDash}</TableCell>
                      <TableCell>{contact.phone ?? emptyDash}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </DetailPageFrame>

      <Sheet
        open={editOpen}
        onOpenChange={setEditOpen}
        title={t('editTitle')}
        footer={
          <SheetFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
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
