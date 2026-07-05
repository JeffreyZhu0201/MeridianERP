'use client';

/**
 * StoreShell - 商店前端消费者门户布局组件
 *
 * Layout aligned with docs/design/stich.md:
 * - h-20 sticky header, max-w-7xl, underline active nav
 * - Icon action row, tertiary cart indicator
 * - Three-column footer
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { IconLayoutGrid, IconShoppingCart, IconUser } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { LocaleToggle } from '../theme/locale-toggle';
import { ModeToggle } from '../theme/mode-toggle';
import { cn } from '../../lib/utils';

export interface StoreShellProps {
  children: ReactNode;
  storeSlug: string;
  storeName?: string;
  cartCount?: number;
  userEmail?: string;
  onLogout?: () => void;
  basePath?: string;
  branchSelect?: ReactNode;
  showBecomeMerchant?: boolean;
}

export function StoreShell({
  children,
  storeSlug,
  storeName,
  cartCount = 0,
  userEmail,
  onLogout,
  basePath,
  branchSelect,
  showBecomeMerchant = false,
}: StoreShellProps) {
  const pathname = usePathname();
  const base = basePath ?? '/shop';
  const t = useTranslations('store.nav');
  const tc = useTranslations('common');

  const accountHref = '/shop/account';
  const loginHref = `/login?from=${encodeURIComponent('/shop/account')}`;

  const navItems = [
    { href: base, label: t('shop'), exact: true },
    { href: `${base}/cart`, label: t('cart') },
    { href: accountHref, label: t('account') },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 md:px-12">
          <Link
            href={base}
            className="store-headline-lg flex items-center gap-2 text-primary hover:opacity-90"
          >
            <IconLayoutGrid className="size-6 shrink-0" stroke={1.75} />
            <span className="hidden sm:inline">{storeName ?? 'Meridian Store'}</span>
            <span className="sm:hidden">{storeName?.slice(0, 12) ?? 'Store'}</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {branchSelect}
            <nav className="flex items-center gap-6">
              {navItems.map((item) => {
                const active = item.href.startsWith('/shop/account')
                  ? pathname === '/shop/account'
                  : item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active ? 'store-nav-link-active' : 'store-nav-link'}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {showBecomeMerchant && userEmail ? (
                <Link href="/open-shop" className="store-nav-link">
                  {t('becomeMerchant')}
                </Link>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-1">
            {branchSelect ? <div className="md:hidden">{branchSelect}</div> : null}
            <LocaleToggle portal="store" />
            <ModeToggle />
            <Link
              href={`${base}/cart`}
              className="store-icon-btn"
              aria-label={`${t('cart')}${cartCount > 0 ? `, ${cartCount}` : ''}`}
            >
              <IconShoppingCart className="size-5" stroke={1.5} />
              {cartCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-[hsl(var(--store-tertiary))] text-[10px] font-bold text-white">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              ) : null}
            </Link>

            <Link
              href={userEmail ? accountHref : loginHref}
              className="store-icon-btn"
              aria-label={userEmail ? t('account') : tc('signIn')}
            >
              <IconUser className="size-5" stroke={1.5} />
            </Link>

            {userEmail ? (
              <div className="hidden items-center gap-2 pl-1 text-sm lg:flex">
                <Link
                  href={accountHref}
                  className="max-w-[140px] truncate text-muted-foreground hover:text-foreground"
                >
                  {userEmail}
                </Link>
                {onLogout ? (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="rounded-full px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    {tc('signOut')}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-12 md:py-12">{children}</main>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm md:flex-row md:px-12">
          <div className="store-headline-lg flex items-center gap-2 text-foreground">
            <IconLayoutGrid className="size-5 text-primary" stroke={1.75} />
            Meridian Store
          </div>
          <div className="store-label flex gap-6 text-muted-foreground">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Legal</span>
          </div>
          <p className="text-xs text-muted-foreground">{tc('poweredBy')}</p>
        </div>
      </footer>
    </div>
  );
}
