import { notFound } from 'next/navigation';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import {
  apiFetch,
  type MerchantDetail,
  type MerchantStatistics,
  type PlatformDistributor,
} from '@/lib/api';
import { OnboardingStatus, type PlatformMerchantPluginsResponse } from '@meridian/shared';
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
  let statistics: MerchantStatistics | undefined;
  try {
    merchant = await apiFetch<MerchantDetail>(`/platform/merchants/${id}`, {}, token);
    [distributors, plugins, statistics] = await Promise.all([
      apiFetch<PlatformDistributor[]>('/platform/distributors', {}, token).catch(() => []),
      apiFetch<PlatformMerchantPluginsResponse>(`/platform/merchants/${id}/plugins`, {}, token).catch(
        () => undefined,
      ),
      merchant.onboardingStatus === OnboardingStatus.APPROVED && merchant.tenantId
        ? apiFetch<MerchantStatistics>(
            `/platform/merchants/${id}/statistics`,
            {},
            token,
          ).catch(() => undefined)
        : Promise.resolve(undefined),
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
        statistics={statistics}
      />
    </AdminShellWithSession>
  );
}
