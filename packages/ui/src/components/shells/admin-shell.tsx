'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import {
  IconBuildingStore,
  IconLayoutDashboard,
  IconCash,
  IconPackage,
  IconReceipt,
  IconSettings,
  IconTruckDelivery,
  IconUsers,
  IconWallet,
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

export interface AdminShellProps {
  children: ReactNode;
  userEmail?: string;
  onLogout?: () => void;
}

const navItems = [
  { href: '/', key: 'dashboard' as const, icon: IconLayoutDashboard },
  { href: '/merchants', key: 'merchants' as const, icon: IconBuildingStore },
  { href: '/distributors', key: 'distributors' as const, icon: IconUsers },
  { href: '/orders', key: 'orders' as const, icon: IconReceipt },
  { href: '/allocations', key: 'allocations' as const, icon: IconPackage },
  { href: '/withdrawals', key: 'withdrawals' as const, icon: IconCash },
  { href: '/funds', key: 'funds' as const, icon: IconTruckDelivery },
  { href: '/settlements', key: 'settlements' as const, icon: IconWallet },
  { href: '/settings', key: 'settings' as const, icon: IconSettings },
];

function AdminNav({ pathname }: { pathname: string }) {
  const t = useTranslations('admin.nav');
  const tc = useTranslations('common');

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{tc('platform')}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map(({ href, key, icon: Icon }) => {
            const label = t(key);
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
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

export function AdminShell({ children, userEmail, onLogout }: AdminShellProps) {
  const pathname = usePathname();
  const t = useTranslations('admin');
  const tc = useTranslations('common');

  return (
    <ErpShell
      portal="admin"
      sidebarHeader={
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold">M</span>
          </div>
          <span className="truncate font-semibold tracking-tight">{t('brand')}</span>
        </div>
      }
      sidebar={<AdminNav pathname={pathname} />}
      headerStart={<span className="text-sm font-medium text-muted-foreground">{tc('platform')}</span>}
      headerEnd={
        <>
          {userEmail ? <span className="text-sm text-muted-foreground">{userEmail}</span> : null}
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full px-3 py-1 text-sm hover:bg-muted"
            >
              {tc('signOut')}
            </button>
          ) : null}
        </>
      }
    >
      {children}
    </ErpShell>
  );
}
