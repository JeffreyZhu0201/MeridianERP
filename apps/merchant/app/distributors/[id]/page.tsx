import { notFound } from 'next/navigation';
import type { QrHistoryListResponse } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  asList,
  type Binding,
  type Distributor,
  type OnboardingProfile,
  type PaginatedResponse,
} from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';
import { fetchDistributorPerformance } from '@/lib/commissions';
import { fetchQrHistory } from '@/lib/distributors';
import { DistributorDetail } from './_components/distributor-detail';

interface DistributorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DistributorDetailPage({ params }: DistributorDetailPageProps) {
  const token = await getToken();
  if (!token) return null;

  const { id } = await params;

  let distributor: Distributor;
  let bindings: Binding[] = [];
  let profile: OnboardingProfile | null = null;
  let qrHistory: QrHistoryListResponse | null = null;
  let performance = null;
  const isOwner = isMerchantOwner(token);

  try {
    [distributor, bindings, profile, qrHistory, performance] = await Promise.all([
      apiFetch<Distributor>(`/merchant/distributors/${id}`, {}, token),
      apiFetch<PaginatedResponse<Binding> | Binding[]>(
        `/merchant/distributors/${id}/bindings`,
        {},
        token,
      )
        .then((r) => asList(r))
        .catch(() => [] as Binding[]),
      apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
      fetchQrHistory(id, token, { page: 1, limit: 20 }).catch(() => null),
      fetchDistributorPerformance(id, token).catch(() => null),
    ]);
  } catch {
    notFound();
  }

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <DistributorDetail
        distributor={distributor}
        bindings={bindings}
        token={token}
        isOwner={isOwner}
        initialQrHistory={qrHistory}
        initialPerformance={performance}
      />
    </MerchantShellWrapper>
  );
}
