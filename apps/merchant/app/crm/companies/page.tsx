import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type Company, type OnboardingProfile, type PaginatedResponse } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { CompaniesTable } from './_components/companies-table';

export default async function CompaniesPage() {
  const token = await getToken();
  if (!token) return null;

  const [companiesRes, profile] = await Promise.all([
    apiFetch<PaginatedResponse<Company>>('/merchant/companies', {}, token).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit: 20 },
    })),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
        <CompaniesTable companies={companiesRes.data} token={token} />
      </div>
    </MerchantShellWrapper>
  );
}
