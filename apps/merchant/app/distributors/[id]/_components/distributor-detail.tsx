'use client';

import { useTranslations } from 'next-intl';
import { DetailPageFrame } from '@meridian/ui';
import type { DistributorPerformanceSummary, QrHistoryListResponse } from '@meridian/shared';

import { type Binding, type Distributor } from '@/lib/api';
import { DistributorTabs } from './distributor-tabs';
import { OverviewPanel } from './overview-panel';
import { PerformancePanel } from './performance-panel';

interface DistributorDetailProps {
  distributor: Distributor;
  bindings: Binding[];
  token: string;
  isOwner: boolean;
  initialQrHistory?: QrHistoryListResponse | null;
  initialPerformance?: DistributorPerformanceSummary | null;
}

export function DistributorDetail({
  distributor,
  bindings,
  token,
  isOwner,
  initialQrHistory,
  initialPerformance,
}: DistributorDetailProps) {
  const t = useTranslations('merchant.distributors.detail');

  return (
    <DetailPageFrame
      title={distributor.name}
      backHref="/distributors"
      backLabel={t('backLabel')}
    >
      <DistributorTabs
        overview={
          <OverviewPanel
            distributor={distributor}
            bindings={bindings}
            token={token}
            isOwner={isOwner}
            initialQrHistory={initialQrHistory}
          />
        }
        performance={
          <PerformancePanel
            distributorId={distributor.id}
            token={token}
            initialPerformance={initialPerformance}
          />
        }
      />
    </DetailPageFrame>
  );
}
