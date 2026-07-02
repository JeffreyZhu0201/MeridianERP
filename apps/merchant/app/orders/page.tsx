import { getTranslations } from 'next-intl/server';
import { BentoListHeader, formatMoney, ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { MerchantOrderListItem } from '@meridian/shared';
import { OrderStatus } from '@meridian/shared';
import { OrdersPanel } from './_components/orders-panel';

export default async function OrdersPage() {
  const t = await getTranslations('merchant.orders');
  const token = await getToken();
  if (!token) return null;

  const [orders, pickupPending, profile] = await Promise.all([
    apiFetch<MerchantOrderListItem[]>('/merchant/orders', {}, token).catch(() => []),
    apiFetch<MerchantOrderListItem[]>('/merchant/orders/pickup-pending', {}, token).catch(
      () => [],
    ),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const paidCount = orders.filter((o) => o.status === OrderStatus.PAID).length;
  const revenueTotal = orders
    .filter((o) => o.status === OrderStatus.PAID)
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')} description={t('description')}>
        <BentoListHeader
          metrics={[
            { title: t('title'), value: orders.length },
            { title: t('tabs.pickupPending'), value: pickupPending.length },
            { title: t('table.status'), value: paidCount },
            {
              title: t('table.total'),
              value: formatMoney(revenueTotal),
            },
          ]}
        />
        <OrdersPanel orders={orders} pickupPending={pickupPending} token={token} />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
