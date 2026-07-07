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
  Input,
  Label,
  Sheet,
  SheetFooter,
} from '@meridian/ui';

import { apiFetch, type Contact } from '@/lib/api';
import { CrmAiFollowUpPanel } from '../../../_components/crm-ai-follow-up-panel';

interface ContactDetailProps {
  contact: Contact;
  token: string;
}

export function ContactDetail({ contact, token }: ContactDetailProps) {
  const router = useRouter();
  const t = useTranslations('merchant.crm.contacts');
  const tc = useTranslations('common');
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email ?? '',
    phone: contact.phone ?? '',
  });
  const [error, setError] = useState('');

  function openEdit() {
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
    });
    setError('');
    setEditOpen(true);
  }

  async function handleSave() {
    setError('');
    try {
      await apiFetch(`/merchant/contacts/${contact.id}`, {
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
        title={`${contact.firstName} ${contact.lastName}`}
        backHref="/crm/contacts"
        backLabel={t('title')}
        actions={<Button onClick={openEdit}>{tc('edit')}</Button>}
      >
        <BentoDetailHero
          metrics={[
            { title: t('detail.email'), value: contact.email ?? emptyDash },
            { title: t('detail.phone'), value: contact.phone ?? emptyDash },
            {
              title: t('company'),
              value: contact.company?.name ?? emptyDash,
            },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>{t('detail.profile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('firstName')}</span>
              <span>{contact.firstName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('lastName')}</span>
              <span>{contact.lastName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{tc('email')}</span>
              <span>{contact.email ?? emptyDash}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{tc('phone')}</span>
              <span>{contact.phone ?? emptyDash}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('company')}</span>
              <span>
                {contact.company && contact.companyId ? (
                  <Link
                    href={`/crm/companies/${contact.companyId}`}
                    className="text-primary hover:underline"
                  >
                    {contact.company.name}
                  </Link>
                ) : contact.company ? (
                  contact.company.name
                ) : (
                  emptyDash
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        <CrmAiFollowUpPanel token={token} contactId={contact.id} />
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
