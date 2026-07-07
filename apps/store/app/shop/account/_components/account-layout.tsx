import { getTranslations } from 'next-intl/server';
import { StoreAccountSidebar } from '@meridian/ui/server';

export async function AccountLayout({
  active,
  showBecomeMerchant,
  children,
}: {
  active: 'orders' | 'addresses' | 'settings';
  showBecomeMerchant?: boolean;
  children: React.ReactNode;
}) {
  const t = await getTranslations('store.account');

  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <StoreAccountSidebar
        active={active}
        navLabel={t('title')}
        showBecomeMerchant={showBecomeMerchant}
        labels={{
          orders: t('sidebar.orders'),
          addresses: t('sidebar.addresses'),
          settings: t('sidebar.settings'),
          becomeMerchant: t('sidebar.becomeMerchant'),
        }}
      />
      <div className="min-w-0 flex-1 space-y-6">{children}</div>
    </div>
  );
}
