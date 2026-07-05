import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  EmptyState,
  formatMoney,
  StoreAccountOrderList,
  StoreAccountProfileHero,
  StoreAccountSidebar,
} from '@meridian/ui/server';
import type { OrderStatus, StoreCustomerProfile, StoreOrderListItem } from '@meridian/shared';

import { ShopShellWrapper } from '@/components/shop-shell-wrapper';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getFulfillmentSlug } from '@/lib/fulfillment';

export default async function ShopAccountPage() {
  const token = await getToken();
  if (!token) {
    redirect('/login?from=%2Fshop%2Faccount');
  }

  const fulfillmentSlug = await getFulfillmentSlug();
  const locale = await getLocale();
  const t = await getTranslations('store');
  const ts = await getTranslations('store.orderStatus');

  if (!fulfillmentSlug) {
    return (
      <ShopShellWrapper fulfillmentSlug="" storeName="Meridian Store">
        <EmptyState
          title={t('home.pickerEmpty')}
          description={t('home.pickerEmptyDescription')}
        />
      </ShopShellWrapper>
    );
  }

  const [profile, orders, cart] = await Promise.all([
    apiFetch<StoreCustomerProfile>('/store/auth/me', {}, token).catch(() => null),
    apiFetch<StoreOrderListItem[]>(storePath(fulfillmentSlug, 'orders'), {}, token).catch(
      () => [],
    ),
    apiFetch<Cart>(storePath(fulfillmentSlug, 'cart'), {}, token).catch(() => null),
  ]);

  const storeName = fulfillmentSlug.charAt(0).toUpperCase() + fulfillmentSlug.slice(1);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const orderTotal = orders.reduce((sum, order) => sum + Number(order.total), 0);

  function orderStatusLabel(status: OrderStatus): string {
    return ts(status);
  }

  return (
    <ShopShellWrapper
      fulfillmentSlug={fulfillmentSlug}
      storeName={storeName}
      cartCount={cartCount}
      userEmail={profile?.email}
    >
      <div className="flex flex-col gap-8 md:flex-row">
        <StoreAccountSidebar
          navLabel={t('account.title')}
          labels={{
            orders: t('account.sidebar.orders'),
            addresses: t('account.sidebar.addresses'),
            settings: t('account.sidebar.settings'),
            comingSoon: t('account.sidebar.comingSoon'),
          }}
        />

        <div className="min-w-0 flex-1 space-y-6">
          {profile ? (
            <StoreAccountProfileHero
              firstName={profile.firstName}
              lastName={profile.lastName}
              email={profile.email}
            />
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="store-bento-card p-4">
              <p className="store-label text-muted-foreground">{t('account.totalOrders')}</p>
              <p className="store-headline-xl tabular-nums">{orders.length}</p>
            </div>
            <div className="store-bento-card p-4">
              <p className="store-label text-muted-foreground">{t('account.lifetimeSpend')}</p>
              <p className="store-headline-xl tabular-nums">
                {formatMoney(orderTotal, locale)}
              </p>
            </div>
          </div>

          <StoreAccountOrderList
            title={t('account.orderHistory')}
            orders={orders.map((order) => ({
              id: order.id,
              dateLabel: new Date(order.createdAt).toLocaleDateString(locale),
              statusLabel: orderStatusLabel(order.status),
              totalLabel: formatMoney(order.total, locale, order.currency),
              viewAction: (
                <Link
                  href={`/shop/orders/${order.id}/confirmation`}
                  className="store-label text-primary hover:underline"
                >
                  {t('account.viewOrder')}
                </Link>
              ),
            }))}
            empty={
              <EmptyState
                title={t('account.empty')}
                action={
                  <Link href="/shop" className="text-sm text-primary hover:underline">
                    {t('account.emptyAction')}
                  </Link>
                }
              />
            }
          />
        </div>
      </div>
    </ShopShellWrapper>
  );
}
