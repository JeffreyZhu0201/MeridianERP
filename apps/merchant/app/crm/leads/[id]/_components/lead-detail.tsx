'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Badge,
  BentoDetailHero,
  DetailPageFrame,
  Select,
} from '@meridian/ui';
import { LeadStage } from '@meridian/shared';

import { apiFetch, type Lead } from '@/lib/api';

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
  const t = useTranslations('merchant.crm.leads');

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
          { title: t('tableSource'), value: lead.source ?? '—' },
          { title: t('tableUpdated'), value: new Date(lead.updatedAt).toLocaleDateString() },
        ]}
      />

      <div className="space-y-4">
        {lead.contact ? (
          <div className="rounded-xl ring-1 ring-border p-4">
            <p className="text-sm font-medium">{t('tableContact')}</p>
            <p className="mt-1">
              {lead.contact.firstName} {lead.contact.lastName}
            </p>
          </div>
        ) : null}

        {lead.distributor ? (
          <div className="rounded-xl ring-1 ring-border p-4">
            <p className="text-sm font-medium">{t('tableDistributor')}</p>
            <p className="mt-1">{lead.distributor.name}</p>
          </div>
        ) : null}
      </div>
    </DetailPageFrame>
  );
}
