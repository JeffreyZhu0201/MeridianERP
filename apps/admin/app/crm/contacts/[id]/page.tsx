import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { PlatformCrmContact } from '@meridian/shared';
import { BentoDetailHero, Card, CardContent, CardHeader, CardTitle, DetailPageFrame } from '@meridian/ui/server';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch } from '@/lib/api';
import { requireToken } from '@/lib/auth';

interface ContactDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  const token = await requireToken();

  const { id } = await params;
  const t = await getTranslations('admin.crm.contacts');
  const tc = await getTranslations('common');

  let contact: PlatformCrmContact;
  try {
    contact = await apiFetch<PlatformCrmContact>(`/platform/crm/contacts/${id}`, {}, token);
  } catch {
    notFound();
  }

  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ');

  return (
    <AdminShellWithSession>
      <DetailPageFrame title={fullName} backHref="/crm/contacts" backLabel={t('title')}>
        <BentoDetailHero
          metrics={[
            {
              title: t('detail.email'),
              value: contact.email ?? tc('emptyDash'),
            },
            {
              title: t('detail.phone'),
              value: contact.phone ?? tc('emptyDash'),
            },
            {
              title: t('company'),
              value: contact.company?.name ?? tc('emptyDash'),
            },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>{t('detail.profile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('detail.email')}</span>
              <span>{contact.email ?? tc('emptyDash')}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('detail.phone')}</span>
              <span>{contact.phone ?? tc('emptyDash')}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('company')}</span>
              <span>
                {contact.company ? (
                  <Link
                    href={`/crm/companies/${contact.company.id}`}
                    className="text-primary hover:underline"
                  >
                    {contact.company.name}
                  </Link>
                ) : (
                  tc('emptyDash')
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </DetailPageFrame>
    </AdminShellWithSession>
  );
}
