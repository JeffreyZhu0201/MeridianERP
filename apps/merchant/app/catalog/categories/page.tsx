import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  asList,
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

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')}>
        <CategoriesTable categories={asList(categoriesRes)} token={token} />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
