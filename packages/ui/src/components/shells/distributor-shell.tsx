'use client';

/**
 * DistributorShell - 渠道经销商门户布局组件
 *
 * 提供渠道经销商（Distributor Portal）的标准页面布局，包含：
 * - 顶部导航栏（经销商名称、仪表盘/分店/佣金/提现）
 * - 简洁的单层导航结构
 * - 暗色模式与国际化切换
 *
 * @example
 * ```tsx
 * <DistributorShell distributorName="北京总代理" onLogout={() => signOut()}>
 *   <Dashboard />
 * </DistributorShell>
 * ```
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { LocaleToggle } from '../theme/locale-toggle';
import { ModeToggle } from '../theme/mode-toggle';
import { shellDividerB } from '../../lib/surfaces';
import { cn } from '../../lib/utils';

/**
 * DistributorShell 属性接口
 * @param children - 页面内容
 * @param distributorName - 经销商名称（显示在导航栏左侧）
 * @param onLogout - 退出登录回调函数
 */
export interface DistributorShellProps {
  children: ReactNode;
  distributorName?: string;
  onLogout?: () => void;
}

export function DistributorShell({
  children,
  distributorName,
  onLogout,
}: DistributorShellProps) {
  const pathname = usePathname();
  const t = useTranslations('distributor.nav');
  const tc = useTranslations('common');

  const navItems = [
    { href: '/', label: t('dashboard'), exact: true },
    { href: '/share', label: t('share') },
    { href: '/branches', label: t('branches') },
    { href: '/commissions', label: t('commissions') },
    { href: '/withdrawals', label: t('withdrawals') },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className={cn('sticky top-0 z-10 bg-background', shellDividerB)}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/" className="truncate text-lg font-semibold tracking-tight hover:text-primary">
              {distributorName ?? t('portalTitle')}
            </Link>
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
              {navItems.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm transition-colors',
                      active
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LocaleToggle portal="distributor" />
            <ModeToggle />
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {tc('signOut')}
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
