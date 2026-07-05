import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { AuthLayout, AuthToolbar } from '@meridian/ui';

export default async function OpenShopPendingPage() {
  const t = await getTranslations('store');

  return (
    <>
      <AuthToolbar portal="store" />
      <AuthLayout subtitle={t('openShop.pendingTitle')}>
        <p className="text-sm text-muted-foreground">{t('openShop.pendingDescription')}</p>
        <Link href="/shop" className="mt-6 inline-block text-sm text-primary hover:underline">
          {t('openShop.backHome')}
        </Link>
      </AuthLayout>
    </>
  );
}
