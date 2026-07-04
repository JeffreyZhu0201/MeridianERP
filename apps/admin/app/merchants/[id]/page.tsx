import { notFound } from 'next/navigation';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch, type MerchantDetail, type PlatformDistributor } from '@/lib/api';
import type { PlatformMerchantPluginsResponse } from '@meridian/shared';
import { requireToken } from '@/lib/auth';
import { MerchantDetailView } from './_components/merchant-detail';

interface MerchantDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MerchantDetailPage({ params }: MerchantDetailPageProps) {
  const token = await requireToken();

  const { id } = await params;

  let merchant: MerchantDetail;
  let distributors: PlatformDistributor[] = [];
  let plugins: PlatformMerchantPluginsResponse | undefined;
  try {
    [merchant, distributors, plugins] = await Promise.all([
      apiFetch<MerchantDetail>(`/platform/merchants/${id}`, {}, token),
      apiFetch<PlatformDistributor[]>('/platform/distributors', {}, token).catch(() => []),
      apiFetch<PlatformMerchantPluginsResponse>(`/platform/merchants/${id}/plugins`, {}, token).catch(
        () => undefined,
      ),
    ]);
  } catch {
    notFound();
  }

  return (
    <AdminShellWithSession>
      <MerchantDetailView
        merchant={merchant}
        token={token}
        distributors={distributors}
        plugins={plugins}
      />
    </AdminShellWithSession>
  );
}
