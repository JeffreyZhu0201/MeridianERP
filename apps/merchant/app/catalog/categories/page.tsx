import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  type Category,
  type OnboardingProfile,
  type PaginatedResponse,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import { CategoriesTable } from './_components/categories-table';

export default async function CategoriesPage() {
  const token = await getToken();
  if (!token) return null;

  const [categoriesRes, profile] = await Promise.all([
    apiFetch<PaginatedResponse<Category>>('/merchant/categories', {}, token).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit: 20 },
    })),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <CategoriesTable categories={categoriesRes.data} token={token} />
      </div>
    </MerchantShellWrapper>
  );
}
