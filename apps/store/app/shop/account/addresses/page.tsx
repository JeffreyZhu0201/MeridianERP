import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import type { CustomerDeliveryAddressRow } from '@meridian/shared';

import { ShopShellWrapper } from '@/components/shop-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getFulfillmentSlug } from '@/lib/fulfillment';

import { AccountLayout } from '../_components/account-layout';
import { AddressesPanel } from '../_components/addresses-panel';

export default async function ShopAccountAddressesPage() {
  const token = await getToken();
  if (!token) {
    redirect('/login?from=%2Fshop%2Faccount%2Faddresses');
  }

  const fulfillmentSlug = await getFulfillmentSlug();
  const t = await getTranslations('store.account');

  if (!fulfillmentSlug) {
    redirect('/shop/account');
  }

  const addresses = await apiFetch<CustomerDeliveryAddressRow[]>(
    '/store/auth/addresses',
    {},
    token,
  ).catch(() => []);

  const storeName = fulfillmentSlug.charAt(0).toUpperCase() + fulfillmentSlug.slice(1);

  return (
    <ShopShellWrapper fulfillmentSlug={fulfillmentSlug} storeName={storeName}>
      <AccountLayout active="addresses">
        <div>
          <h1 className="store-headline-xl mb-2">{t('sidebar.addresses')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <AddressesPanel initialAddresses={addresses} token={token} />
      </AccountLayout>
    </ShopShellWrapper>
  );
}
