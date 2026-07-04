import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui/server';
import type { MerchantPluginCatalogResponse } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';
import { PluginMarketplace } from './_components/plugin-marketplace';

interface PluginsPageProps {
  searchParams: Promise<{ highlight?: string }>;
}

export default async function PluginsPage({ searchParams }: PluginsPageProps) {
  const token = await getToken();
  const t = await getTranslations('merchant.plugins');
  const { highlight } = await searchParams;

  const catalog = token
    ? await apiFetch<MerchantPluginCatalogResponse>('/merchant/plugins', {}, token).catch(
        () => ({ items: [] }),
      )
    : { items: [] };

  return (
    <MerchantShellWrapper>
      <ListPageFrame title={t('title')} description={t('description')}>
        <PluginMarketplace
          items={catalog.items}
          isOwner={token ? isMerchantOwner(token) : false}
          highlight={highlight}
          token={token}
        />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
