import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { MerchantOrderListItem } from '@meridian/shared';
import { OrdersTable } from './_components/orders-table';

export default async function OrdersPage() {
  const t = await getTranslations('merchant.orders');
  const token = await getToken();
  if (!token) return null;

  const [orders, profile] = await Promise.all([
    apiFetch<MerchantOrderListItem[]>('/merchant/orders', {}, token).catch(() => []),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')} description={t('description')}>
        <OrdersTable orders={orders} />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
