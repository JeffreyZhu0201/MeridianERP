import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { PlatformCrmCompany, PlatformCrmContact } from '@meridian/shared';
import {
  BentoDetailHero,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DetailPageFrame,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui/server';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch } from '@/lib/api';
import { requireToken } from '@/lib/auth';

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const token = await requireToken();

  const { id } = await params;
  const t = await getTranslations('admin.crm.companies');
  const tc = await getTranslations('common');

  let company: PlatformCrmCompany;
  let contacts: PlatformCrmContact[] = [];
  try {
    const [companyRes, allContacts] = await Promise.all([
      apiFetch<PlatformCrmCompany>(`/platform/crm/companies/${id}`, {}, token),
      apiFetch<PlatformCrmContact[]>('/platform/crm/contacts', {}, token),
    ]);
    company = companyRes;
    contacts = allContacts.filter((c) => c.companyId === id);
  } catch {
    notFound();
  }

  return (
    <AdminShellWithSession>
      <DetailPageFrame
        title={company.name}
        backHref="/crm/companies"
        backLabel={t('title')}
      >
        <BentoDetailHero
          metrics={[
            { title: t('contacts'), value: contacts.length },
            {
              title: t('website'),
              value: company.website ?? tc('emptyDash'),
            },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>{t('detail.profile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('website')}</span>
              <span>{company.website ?? tc('emptyDash')}</span>
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
                          {[contact.firstName, contact.lastName].filter(Boolean).join(' ')}
                        </Link>
                      </TableCell>
                      <TableCell>{contact.email ?? tc('emptyDash')}</TableCell>
                      <TableCell>{contact.phone ?? tc('emptyDash')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </DetailPageFrame>
    </AdminShellWithSession>
  );
}
