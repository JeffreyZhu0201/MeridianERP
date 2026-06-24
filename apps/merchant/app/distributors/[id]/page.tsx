import { notFound } from 'next/navigation';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  type Binding,
  type Distributor,
  type OnboardingProfile,
  type PaginatedResponse,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
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

  try {
    [distributor, bindings, profile] = await Promise.all([
      apiFetch<Distributor>(`/merchant/distributors/${id}`, {}, token),
      apiFetch<PaginatedResponse<Binding>>(`/merchant/distributors/${id}/bindings`, {}, token)
        .then((r) => r.data)
        .catch(() => [] as Binding[]),
      apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
    ]);
  } catch {
    notFound();
  }

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <DistributorDetail distributor={distributor} bindings={bindings} token={token} />
    </MerchantShellWrapper>
  );
}
