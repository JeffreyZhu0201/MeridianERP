import { getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
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

export default async function ReplenishmentPage() {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.replenishment');

  let requests: ReplenishmentRequestRow[] = [];
  try {
    requests = await apiFetch<ReplenishmentRequestRow[]>(
      '/platform/replenishment?status=PENDING',
      {},
      token,
    );
  } catch {
    requests = [];
  }

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader metrics={[{ title: t('title'), value: requests.length }]} />
        <ListPageFrame title={t('title')} description={t('description')}>
          <ReplenishmentView requests={requests} token={token} />
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
