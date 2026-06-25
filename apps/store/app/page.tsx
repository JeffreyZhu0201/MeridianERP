import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { AuthStatusFrame } from '@meridian/ui';

export default async function HomePage() {
  const t = await getTranslations('store');

  return (
    <AuthStatusFrame
      subtitle={t('home.portalSubtitle')}
      title={t('home.title')}
      description={
        <>
          {t('home.visitPath')}{' '}
          <code className="text-foreground">/s/your-store-slug</code>
        </>
      }
      footer={
        <Link href="/s/demo" className="text-sm text-primary hover:underline">
          {t('home.tryDemo')}
        </Link>
      }
    />
  );
}
