import { getTranslations } from 'next-intl/server';
import { BentoListHeader, formatMoney, ListPageFrame } from '@meridian/ui/server';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { MerchantOrderListItem, MerchantSettingsDto } from '@meridian/shared';
import { OrderStatus } from '@meridian/shared';
import { OrdersPanel } from './_components/orders-panel';

export default async function OrdersPage() {
  const t = await getTranslations('merchant.orders');
  const token = await getToken();
  if (!token) return null;

  const settings = await apiFetch<MerchantSettingsDto>(
    '/merchant/settings',
    {},
    token,
  ).catch(() => null);

  const isFlagship = settings?.profile.isFlagship ?? false;
  const businessName = settings?.profile.businessName ?? '';

  const [orders, pickupPending, deliveryPending] = await Promise.all([
    apiFetch<MerchantOrderListItem[]>('/merchant/orders', {}, token).catch(() => []),
    apiFetch<MerchantOrderListItem[]>('/merchant/orders/pickup-pending', {}, token).catch(
      () => [],
    ),
    isFlagship
      ? Promise.resolve([])
      : apiFetch<MerchantOrderListItem[]>('/merchant/orders/delivery-pending', {}, token).catch(
          () => [],
        ),
  ]);

  const paidCount = orders.filter((o) => o.status === OrderStatus.PAID).length;
  const revenueTotal = orders
    .filter((o) => o.status === OrderStatus.PAID)
    .reduce((sum, o) => sum + Number(o.total), 0);

  const metrics = [
    { title: t('title'), value: orders.length },
    { title: t('tabs.pickupPending'), value: pickupPending.length },
  ];

  if (!isFlagship) {
    metrics.push({ title: t('tabs.deliveryPending'), value: deliveryPending.length });
  }

  metrics.push(
    { title: t('table.status'), value: paidCount },
    { title: t('table.total'), value: formatMoney(revenueTotal) },
  );

  return (
    <MerchantShellWrapper businessName={businessName}>
      <ListPageFrame title={t('title')} description={t('description')}>
        <BentoListHeader metrics={metrics} />
        <OrdersPanel
          orders={orders}
          pickupPending={pickupPending}
          deliveryPending={deliveryPending}
          token={token}
          businessName={businessName}
          showDeliveryTab={!isFlagship}
        />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
