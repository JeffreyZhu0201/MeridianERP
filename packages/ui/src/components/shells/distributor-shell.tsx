'use client';

/**
 * DistributorShell - 拓店员门户布局组件
 *
 * 提供拓店员（Distributor Portal）的标准页面布局，包含：
 * - 可折叠侧边栏导航（仪表盘、分享拓店、分店、佣金、提现）
 * - 顶部工具栏（经销商名称、退出按钮）
 * - 暗色模式与国际化切换
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import {
  IconBuildingStore,
  IconCash,
  IconCoins,
  IconLayoutDashboard,
  IconShare,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { ErpShell } from '../frameworks/erp-shell';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar';

export interface DistributorShellProps {
  children: ReactNode;
  distributorName?: string;
  onLogout?: () => void;
}

type NavItem = {
  href: string;
  labelKey: 'dashboard' | 'share' | 'branches' | 'commissions' | 'withdrawals';
  icon: typeof IconLayoutDashboard;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { href: '/', labelKey: 'dashboard', icon: IconLayoutDashboard, exact: true },
  { href: '/share', labelKey: 'share', icon: IconShare },
  { href: '/branches', labelKey: 'branches', icon: IconBuildingStore },
  { href: '/commissions', labelKey: 'commissions', icon: IconCoins },
  { href: '/withdrawals', labelKey: 'withdrawals', icon: IconCash },
];

function DistributorNav({ pathname }: { pathname: string }) {
  const t = useTranslations('distributor.nav');
  const tc = useTranslations('common');

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{tc('navigation')}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map(({ href, labelKey, icon: Icon, exact }) => {
            const label = t(labelKey);
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton isActive={active} tooltip={label} asChild>
                  <Link href={href}>
                    <Icon stroke={1.5} />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function DistributorShell({
  children,
  distributorName,
  onLogout,
}: DistributorShellProps) {
  const pathname = usePathname();
  const t = useTranslations('distributor.nav');
  const tc = useTranslations('common');

  const sidebarTitle = distributorName ?? t('portalTitle');
  const sidebarInitial = distributorName?.charAt(0)?.toUpperCase() ?? 'D';

  return (
    <ErpShell
      portal="distributor"
      sidebarHeader={
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold">{sidebarInitial}</span>
          </div>
          <span className="truncate font-semibold tracking-tight">{sidebarTitle}</span>
        </div>
      }
      sidebar={<DistributorNav pathname={pathname} />}
      headerEnd={
        onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full px-3 py-1 text-sm hover:bg-muted"
          >
            {tc('signOut')}
          </button>
        ) : null
      }
    >
      {children}
    </ErpShell>
  );
}
