'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LocaleToggle, ModeToggle } from '@meridian/ui';

export function DistributorHeader() {
  const t = useTranslations('distributor.nav');
  const tc = useTranslations('common');

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="font-medium hover:text-primary">
            {t('dashboard')}
          </Link>
          <Link href="/commissions" className="text-muted-foreground hover:text-primary">
            {t('commissions')}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LocaleToggle portal="distributor" />
          <ModeToggle />
          <Link href="/logout" className="text-sm text-muted-foreground hover:text-primary">
            {tc('signOut')}
          </Link>
        </div>
      </div>
    </header>
  );
}
