import { getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui/server';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ProcurementView, type PlatformProcurementOrderRow } from './_components/procurement-view';

interface ProcurementPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ProcurementPage({ searchParams }: ProcurementPageProps) {
  const token = await getToken();
  if (!token) return null;

  const params = await searchParams;
  const status = params.status ?? 'PROCESSING';
  const query = status && status !== 'ALL' ? `?status=${status}` : '';

  const orders = await apiFetch<PlatformProcurementOrderRow[]>(
    `/platform/procurement/orders${query}`,
    {},
    token,
  ).catch(() => []);

  const t = await getTranslations('admin.procurement');
  const pendingShip = orders.filter((o) => o.status === 'PROCESSING').length;

  return (
    <div className="space-y-6">
      <BentoListHeader
        metrics={[
          { title: t('title'), value: orders.length },
          { title: t('pendingShip'), value: pendingShip },
        ]}
      />
      <ListPageFrame title={t('title')} description={t('description')}>
        <ProcurementView orders={orders} token={token} />
      </ListPageFrame>
    </div>
  );
}
