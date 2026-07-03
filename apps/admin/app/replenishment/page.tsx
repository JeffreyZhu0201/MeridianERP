import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui/server';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ReplenishmentStatusTabs } from './_components/replenishment-status-tabs';
import { ReplenishmentView } from './_components/replenishment-view';

export interface ReplenishmentRequestRow {
  id: string;
  status: string;
  note: string | null;
  rejectionReason: string | null;
  createdAt: string;
  tenant: {
    merchantProfile: { businessName: string } | null;
    slug: string;
  };
  lines: Array<{
    quantity: number;
    masterSku: { skuCode: string; name: string };
  }>;
}

interface ReplenishmentPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ReplenishmentPage({ searchParams }: ReplenishmentPageProps) {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.replenishment');
  const params = await searchParams;
  const status = params.status ?? 'PENDING';

  const query = new URLSearchParams();
  if (status && status !== 'ALL') query.set('status', status);

  let requests: ReplenishmentRequestRow[] = [];
  try {
    const queryString = query.toString();
    requests = await apiFetch<ReplenishmentRequestRow[]>(
      `/platform/replenishment${queryString ? `?${queryString}` : ''}`,
      {},
      token,
    );
  } catch {
    requests = [];
  }

  return (
    <AdminShellWithSession>
      <div className="space-y-6">
        <BentoListHeader metrics={[{ title: t('title'), value: requests.length }]} />
        <Suspense fallback={null}>
          <ReplenishmentStatusTabs />
        </Suspense>
        <ListPageFrame title={t('title')} description={t('description')}>
          <ReplenishmentView requests={requests} token={token} status={status} />
        </ListPageFrame>
      </div>
    </AdminShellWithSession>
  );
}
