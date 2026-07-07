'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Badge,
  BentoDetailHero,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DetailPageFrame,
  Select,
} from '@meridian/ui';
import { LeadStage } from '@meridian/shared';

import { apiFetch, type Lead } from '@/lib/api';
import { CrmAiFollowUpPanel } from '../../../_components/crm-ai-follow-up-panel';

interface LeadDetailProps {
  lead: Lead;
  token: string;
}

const stageVariant: Record<string, 'default' | 'warning' | 'success' | 'destructive'> = {
  [LeadStage.NEW]: 'default',
  [LeadStage.QUALIFIED]: 'warning',
  [LeadStage.WON]: 'success',
  [LeadStage.LOST]: 'destructive',
};

export function LeadDetail({ lead, token }: LeadDetailProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('merchant.crm.leads');
  const tc = useTranslations('common');

  function stageLabel(stage: string): string {
    return t(`stage.${stage as 'NEW' | 'QUALIFIED' | 'WON' | 'LOST'}`);
  }

  async function updateStage(stage: string) {
    await apiFetch(`/merchant/leads/${lead.id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    }, token);
    router.refresh();
  }

  const emptyDash = tc('emptyDash');

  return (
    <DetailPageFrame
      title={lead.title}
      backHref="/crm/leads"
      backLabel={t('title')}
      badges={<Badge variant={stageVariant[lead.stage] ?? 'secondary'}>{stageLabel(lead.stage)}</Badge>}
      actions={
        <Select
          value={lead.stage}
          onChange={(e) => updateStage(e.target.value)}
          className="w-40"
        >
          {Object.values(LeadStage).map((s) => (
            <option key={s} value={s}>
              {stageLabel(s)}
            </option>
          ))}
        </Select>
      }
    >
      <BentoDetailHero
        metrics={[
          { title: t('tableStage'), value: stageLabel(lead.stage) },
          { title: t('tableSource'), value: lead.source ?? emptyDash },
          {
            title: t('tableUpdated'),
            value: new Date(lead.updatedAt).toLocaleDateString(locale),
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('detail.profile')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{t('tableStage')}</span>
            <Badge variant={stageVariant[lead.stage] ?? 'secondary'}>{stageLabel(lead.stage)}</Badge>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{t('tableSource')}</span>
            <span>{lead.source ?? emptyDash}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{t('tableContact')}</span>
            <span>
              {lead.contact ? (
                <Link
                  href={`/crm/contacts/${lead.contact.id}`}
                  className="text-primary hover:underline"
                >
                  {lead.contact.firstName} {lead.contact.lastName}
                </Link>
              ) : (
                emptyDash
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      <CrmAiFollowUpPanel token={token} leadId={lead.id} />
    </DetailPageFrame>
  );
}
