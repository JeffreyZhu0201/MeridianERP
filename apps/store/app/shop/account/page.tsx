import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Badge,
  EmptyState,
  formatMoney,
  StoreAccountOrderList,
  StoreAccountProfileHero,
} from '@meridian/ui/server';
import type {
  OrderStatus,
  StoreCustomerProfile,
  StoreMerchantApplicationStatus,
  StoreOrderListItem,
} from '@meridian/shared';

import { ShopShellWrapper } from '@/components/shop-shell-wrapper';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getFulfillmentSlug } from '@/lib/fulfillment';

import { AccountLayout } from './_components/account-layout';

const MERCHANT_PORTAL_URL =
  process.env.NEXT_PUBLIC_MERCHANT_URL ??
  process.env.MERCHANT_APP_URL ??
  'http://localhost:3002';

function applicationStatusVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' | 'warning' | 'success' {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'destructive';
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
      return 'warning';
    default:
      return 'secondary';
  }
}

function shouldShowBecomeMerchant(application: StoreMerchantApplicationStatus | null): boolean {
  if (!application) return true;
  if (application.onboardingStatus === 'APPROVED') return false;
  if (application.onboardingStatus === 'REJECTED') return true;
  return false;
}

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

  const [profile, orders, cart, application] = await Promise.all([
    apiFetch<StoreCustomerProfile>('/store/auth/me', {}, token).catch(() => null),
    apiFetch<StoreOrderListItem[]>(storePath(fulfillmentSlug, 'orders'), {}, token).catch(
      () => [],
    ),
    apiFetch<Cart>(storePath(fulfillmentSlug, 'cart'), {}, token).catch(() => null),
    apiFetch<StoreMerchantApplicationStatus | null>('/store/merchant-applications/me', {}, token).catch(
      () => null,
    ),
  ]);

  const storeName = fulfillmentSlug.charAt(0).toUpperCase() + fulfillmentSlug.slice(1);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const orderTotal = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const showBecomeMerchant = shouldShowBecomeMerchant(application);

  function orderStatusLabel(status: OrderStatus): string {
    return ts(status);
  }

  function applicationStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      SUBMITTED: t('account.applicationStatus.SUBMITTED'),
      UNDER_REVIEW: t('account.applicationStatus.UNDER_REVIEW'),
      APPROVED: t('account.applicationStatus.APPROVED'),
      REJECTED: t('account.applicationStatus.REJECTED'),
      DRAFT: t('account.applicationStatus.DRAFT'),
    };
    return labels[status] ?? status;
  }

  return (
    <ShopShellWrapper
      fulfillmentSlug={fulfillmentSlug}
      storeName={storeName}
      cartCount={cartCount}
      userEmail={profile?.email}
      showBecomeMerchant={showBecomeMerchant}
    >
      <AccountLayout active="orders" showBecomeMerchant={showBecomeMerchant}>
          {profile ? (
            <StoreAccountProfileHero
              firstName={profile.firstName}
              lastName={profile.lastName}
              email={profile.email}
            />
          ) : null}

          {application ? (
            <div className="store-bento-card space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="store-headline-lg">{t('account.merchantApplication')}</h2>
                <Badge variant={applicationStatusVariant(application.onboardingStatus)}>
                  {applicationStatusLabel(application.onboardingStatus)}
                </Badge>
              </div>
              <p className="text-sm font-medium text-foreground">{application.businessName}</p>
              {application.submittedAt ? (
                <p className="text-sm text-muted-foreground">
                  {t('account.applicationSubmittedAt', {
                    date: new Date(application.submittedAt).toLocaleDateString(locale),
                  })}
                </p>
              ) : null}
              {application.onboardingStatus === 'APPROVED' ? (
                <a
                  href={MERCHANT_PORTAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-sm font-medium text-primary hover:underline"
                >
                  {t('account.goToMerchant')} →
                </a>
              ) : null}
              {application.onboardingStatus === 'REJECTED' ? (
                <Link
                  href="/open-shop"
                  className="inline-flex text-sm font-medium text-primary hover:underline"
                >
                  {t('account.reapply')} →
                </Link>
              ) : null}
            </div>
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
      </AccountLayout>
    </ShopShellWrapper>
  );
}
