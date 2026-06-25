import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, asList, type OnboardingProfile, type PaginatedResponse, type Product } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ProductsTable } from './_components/products-table';

export default async function ProductsPage() {
  const t = await getTranslations('merchant.catalog.products');
  const token = await getToken();
  if (!token) return null;

  const [productsRes, profile, categoriesRes] = await Promise.all([
    apiFetch<PaginatedResponse<Product> | Product[]>('/merchant/products', {}, token).catch(
      () => [] as Product[],
    ),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
    apiFetch<PaginatedResponse<{ id: string; name: string }> | { id: string; name: string }[]>(
      '/merchant/categories',
      {},
      token,
    ).catch(() => [] as { id: string; name: string }[]),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')}>
        <ProductsTable
          products={asList(productsRes)}
          categories={asList(categoriesRes)}
          token={token}
        />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
