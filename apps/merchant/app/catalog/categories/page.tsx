import { getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  asList,
  asListTotal,
  type Category,
  type OnboardingProfile,
  type PaginatedResponse,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import { CategoriesTable } from './_components/categories-table';

export default async function CategoriesPage() {
  const t = await getTranslations('merchant.catalog.categories');
  const token = await getToken();
  if (!token) return null;

  const [categoriesRes, profile] = await Promise.all([
    apiFetch<PaginatedResponse<Category> | Category[]>('/merchant/categories', {}, token).catch(
      () => [] as Category[],
    ),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const categories = asList(categoriesRes);
  const productCount = categories.reduce((sum, c) => sum + (c._count?.products ?? 0), 0);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')}>
        <BentoListHeader
          metrics={[
            { title: t('title'), value: asListTotal(categoriesRes) },
            { title: t('products'), value: productCount },
          ]}
        />
        <CategoriesTable categories={categories} token={token} />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
