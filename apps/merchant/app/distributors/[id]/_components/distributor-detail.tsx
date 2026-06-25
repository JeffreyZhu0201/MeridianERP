'use client';

import { useTranslations } from 'next-intl';
import { BentoDetailHero, DetailPageFrame } from '@meridian/ui';
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
  const tOverview = useTranslations('merchant.distributors.overview');
  const tPerf = useTranslations('merchant.distributors.performance');

  function formatMoney(value: string | number): string {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
      Number(value),
    );
  }

  return (
    <DetailPageFrame
      title={distributor.name}
      backHref="/distributors"
      backLabel={t('backLabel')}
    >
      <BentoDetailHero
        metrics={[
          { title: tOverview('bindings'), value: bindings.length },
          {
            title: tPerf('attributedOrders'),
            value: initialPerformance?.attributedOrderCount ?? 0,
          },
          {
            title: tPerf('orderRevenue'),
            value: formatMoney(initialPerformance?.attributedOrderRevenue ?? 0),
          },
          {
            title: tPerf('commissionAccrued'),
            value: formatMoney(initialPerformance?.commissionAccrued ?? 0),
          },
        ]}
      />
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
