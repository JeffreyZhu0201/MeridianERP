import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { MerchantPluginCode } from '@meridian/shared';
import { EmptyState, ListPageFrame } from '@meridian/ui/server';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { getInstalledPluginCodes } from '@/lib/plugins';

interface PluginStubPageProps {
  pluginCode: MerchantPluginCode;
}

export async function PluginStubPage({ pluginCode }: PluginStubPageProps) {
  const installed = await getInstalledPluginCodes();

  if (!installed.includes(pluginCode)) {
    redirect(`/plugins?highlight=${pluginCode}`);
  }

  const t = await getTranslations('merchant.plugins');
  const tNav = await getTranslations('merchant.nav');

  const titleKey =
    pluginCode === 'finance_tax'
      ? 'financeTax'
      : pluginCode === 'e_signature'
        ? 'eSignature'
        : pluginCode === 'customer_service'
          ? 'customerService'
          : pluginCode;

  return (
    <MerchantShellWrapper installedPluginCodes={installed}>
      <ListPageFrame title={tNav(titleKey)}>
        <EmptyState
          title={t('stubTitle', { name: tNav(titleKey) })}
          description={t('stubDescription')}
          action={
            <Link
              href="/plugins"
              className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              {t('backToMarketplace')}
            </Link>
          }
        />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
