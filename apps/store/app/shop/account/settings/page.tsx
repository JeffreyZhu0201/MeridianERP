import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import type { StoreCustomerProfile } from '@meridian/shared';

import { ShopShellWrapper } from '@/components/shop-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getFulfillmentSlug } from '@/lib/fulfillment';

import { AccountLayout } from '../_components/account-layout';
import { SettingsPanel } from '../_components/settings-panel';

export default async function ShopAccountSettingsPage() {
  const token = await getToken();
  if (!token) {
    redirect('/login?from=%2Fshop%2Faccount%2Fsettings');
  }

  const fulfillmentSlug = await getFulfillmentSlug();
  const t = await getTranslations('store.account');

  if (!fulfillmentSlug) {
    redirect('/shop/account');
  }

  const profile = await apiFetch<StoreCustomerProfile>('/store/auth/me', {}, token).catch(
    () => null,
  );
  if (!profile) {
    redirect('/login?from=%2Fshop%2Faccount%2Fsettings');
  }

  const storeName = fulfillmentSlug.charAt(0).toUpperCase() + fulfillmentSlug.slice(1);

  return (
    <ShopShellWrapper fulfillmentSlug={fulfillmentSlug} storeName={storeName}>
      <AccountLayout active="settings">
        <div>
          <h1 className="store-headline-xl mb-2">{t('sidebar.settings')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <SettingsPanel profile={profile} token={token} />
      </AccountLayout>
    </ShopShellWrapper>
  );
}
