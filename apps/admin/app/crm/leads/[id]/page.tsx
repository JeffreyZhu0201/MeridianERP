import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { PlatformCrmLead } from '@meridian/shared';
import { Badge, BentoDetailHero, Card, CardContent, CardHeader, CardTitle, DetailPageFrame } from '@meridian/ui/server';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch } from '@/lib/api';
import { requireToken } from '@/lib/auth';

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const token = await requireToken();

  const { id } = await params;
  const t = await getTranslations('admin.crm.leads');
  const tc = await getTranslations('common');

  let lead: PlatformCrmLead;
  try {
    lead = await apiFetch<PlatformCrmLead>(`/platform/crm/leads/${id}`, {}, token);
  } catch {
    notFound();
  }

  return (
    <AdminShellWithSession>
      <DetailPageFrame title={lead.title} backHref="/crm/leads" backLabel={t('title')}>
        <BentoDetailHero
          metrics={[
            {
              title: t('stageLabel'),
              value: t(`stage.${lead.stage as 'NEW' | 'QUALIFIED' | 'WON' | 'LOST'}`),
            },
            { title: t('source'), value: lead.source ?? tc('emptyDash') },
            {
              title: t('contact'),
              value: lead.contact
                ? [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ')
                : tc('emptyDash'),
            },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>{t('detail.profile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('stageLabel')}</span>
              <Badge variant="secondary">
                {t(`stage.${lead.stage as 'NEW' | 'QUALIFIED' | 'WON' | 'LOST'}`)}
              </Badge>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('source')}</span>
              <span>{lead.source ?? tc('emptyDash')}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('contact')}</span>
              <span>
                {lead.contact ? (
                  <Link
                    href={`/crm/contacts/${lead.contact.id}`}
                    className="text-primary hover:underline"
                  >
                    {[lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ')}
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
