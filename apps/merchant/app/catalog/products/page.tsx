import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile, type PaginatedResponse, type Product } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ProductsTable } from './_components/products-table';

export default async function ProductsPage() {
  const token = await getToken();
  if (!token) return null;

  const [productsRes, profile, categoriesRes] = await Promise.all([
    apiFetch<PaginatedResponse<Product>>('/merchant/products', {}, token).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit: 20 },
    })),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
    apiFetch<PaginatedResponse<{ id: string; name: string }>>('/merchant/categories', {}, token).catch(
      () => ({ data: [], meta: { total: 0, page: 1, limit: 100 } }),
    ),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <ProductsTable
          products={productsRes.data}
          categories={categoriesRes.data}
          token={token}
        />
      </div>
    </MerchantShellWrapper>
  );
}
