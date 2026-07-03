'use client';

/**
 * StoreShell - 商店前端消费者门户布局组件
 *
 * 提供消费者商店（Store Front）的标准页面布局，包含：
 * - 顶部固定导航栏（商店名、购物车、用户账户）
 * - 购物车数量徽章（显示在购物车图标上）
 * - 底部页脚（Powered by MeridianERP）
 * - 暗色模式与国际化切换
 *
 * @example
 * ```tsx
 * <StoreShell
 *   storeSlug="starbucks-zhongguancun"
 *   storeName="星巴克 - 中关村店"
 *   cartCount={3}
 *   userEmail="customer@example.com"
 * >
 *   <ProductCatalog />
 * </StoreShell>
 * ```
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { IconShoppingCart, IconUser } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { LocaleToggle } from '../theme/locale-toggle';
import { ModeToggle } from '../theme/mode-toggle';
import { shellDividerB, shellDividerT } from '../../lib/surfaces';
import { cn } from '../../lib/utils';

/**
 * StoreShell 属性接口
 * @param children - 页面内容（商品目录、购物车、账户页面等）
 * @param storeSlug - 商店 URL slug（用于生成商店内链接）
 * @param storeName - 商店显示名称
 * @param cartCount - 购物车商品数量（显示徽章，超过 9 显示 9+）
 * @param userEmail - 当前登录用户邮箱（未登录则显示登录链接）
 * @param onLogout - 退出登录回调函数
 */
export interface StoreShellProps {
  children: ReactNode;
  storeSlug: string;
  storeName?: string;
  cartCount?: number;
  userEmail?: string;
  onLogout?: () => void;
  /** Base path for nav links; defaults to `/s/{storeSlug}` */
  basePath?: string;
  /** Optional branch picker shown in the header */
  branchSelect?: ReactNode;
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
}: StoreShellProps) {
  const pathname = usePathname();
  const base = basePath ?? `/s/${storeSlug}`;
  const t = useTranslations('store.nav');
  const tc = useTranslations('common');

  const navItems = [
    { href: base, label: t('shop'), exact: true },
    { href: `${base}/cart`, label: t('cart') },
    { href: `${base}/account`, label: t('account') },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className={cn('sticky top-0 z-10 bg-background', shellDividerB)}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link
            href={base}
            className="text-lg font-semibold tracking-tight hover:text-primary"
          >
            {storeName ?? storeSlug}
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {branchSelect}
            <LocaleToggle portal="store" />
            <ModeToggle />
            {userEmail ? (
              <div className="hidden items-center gap-2 text-sm sm:flex">
                <span className="max-w-[140px] truncate text-muted-foreground">{userEmail}</span>
                {onLogout ? (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="rounded-full px-3 py-1 hover:bg-muted"
                  >
                    {tc('signOut')}
                  </button>
                ) : null}
              </div>
            ) : (
              <Link
                href={`${base}/login`}
                className="hidden rounded-full px-3 py-1 text-sm text-muted-foreground hover:bg-muted sm:inline"
              >
                {tc('signIn')}
              </Link>
            )}

            <Link
              href={`${base}/cart`}
              className="relative flex size-11 items-center justify-center rounded-full hover:bg-muted"
              aria-label={`${t('cart')}${cartCount > 0 ? `, ${cartCount}` : ''}`}
            >
              <IconShoppingCart className="size-5" stroke={1.5} />
              {cartCount > 0 ? (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              ) : null}
            </Link>

            <Link
              href={userEmail ? `${base}/account` : `${base}/login`}
              className="flex size-11 items-center justify-center rounded-full hover:bg-muted sm:hidden"
              aria-label={t('account')}
            >
              <IconUser className="size-5" stroke={1.5} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>

      <footer className={cn(shellDividerT, 'py-6')}>
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground">
          {tc('poweredBy')}
        </div>
      </footer>
    </div>
  );
}
