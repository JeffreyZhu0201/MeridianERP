import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  type Distributor,
  type OnboardingProfile,
  type PaginatedResponse,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import { DistributorsTable } from './_components/distributors-table';

export default async function DistributorsPage() {
  const token = await getToken();
  if (!token) return null;

  const [distributorsRes, profile] = await Promise.all([
    apiFetch<PaginatedResponse<Distributor>>('/merchant/distributors', {}, token).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit: 20 },
    })),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Distributors</h1>
        <DistributorsTable distributors={distributorsRes.data} token={token} />
      </div>
    </MerchantShellWrapper>
  );
}
