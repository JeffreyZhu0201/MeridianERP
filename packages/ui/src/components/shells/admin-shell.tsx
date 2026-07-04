'use client';

/**
 * AdminShell - 平台管理员门户布局组件
 *
 * 提供平台管理员（Admin Portal）的标准页面布局，包含：
 * - 可折叠侧边栏导航（CRM、订单、配额、资金等）
 * - 顶部工具栏（平台标识、用户邮箱、退出按钮）
 * - 暗色模式与国际化切换
 *
 * @example
 * ```tsx
 * <AdminShell userEmail="admin@meridian.test" onLogout={() => signOut()}>
 *   <DashboardContent />
 * </AdminShell>
 * ```
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useMemo, useState } from 'react';
import {
  IconAddressBook,
  IconBox,
  IconBuildingStore,
  IconCash,
  IconChevronRight,
  IconClipboardList,
  IconLayoutDashboard,
  IconPackage,
  IconReceipt,
  IconReportMoney,
  IconSettings,
  IconShield,
  IconTruckDelivery,
  IconUserCircle,
  IconUsers,
  IconWallet,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { adminRoleHasPermission, type AdminPermission } from '@meridian/shared';
import { ErpShell } from '../frameworks/erp-shell';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '../ui/sidebar';

/**
 * AdminShell 属性接口
 * @param children - 页面内容
 * @param userEmail - 当前登录用户邮箱（显示在顶部工具栏）
 * @param onLogout - 退出登录回调函数
 */
export interface AdminShellProps {
  children: ReactNode;
  userEmail?: string;
  role?: string;
  permissions?: AdminPermission[];
  onLogout?: () => void;
  headerStart?: ReactNode;
}

/** 导航子项类型 - 二级菜单项 */
type NavChild = { href: string; labelKey: string };
/** 导航项类型 - 一级菜单（可包含子菜单） */
type NavItem = {
  href: string;
  key: string;
  icon: typeof IconLayoutDashboard;
  children?: NavChild[];
};

/**
 * 平台管理员导航配置
 * - dashboard: 首页/仪表盘
 * - merchants: 商户管理
 * - distributors: 渠道经销商管理
 * - orders: 订单管理
 * - allocations: 配额分配
 * - replenishment: 补货管理
 * - withdrawals: 提现管理
 * - funds: 资金管理
 * - settlements: 结算管理
 * - crm: CRM 客户管理（Contacts/Companies/Leads 子菜单）
 * - settings: 系统设置
 */
const navItems: NavItem[] = [
  { href: '/', key: 'dashboard', icon: IconLayoutDashboard },
  { href: '/users', key: 'users', icon: IconUserCircle },
  { href: '/admins', key: 'admins', icon: IconShield },
  { href: '/merchants', key: 'merchants', icon: IconBuildingStore },
  { href: '/inventory', key: 'inventory', icon: IconBox },
  { href: '/distributors', key: 'distributors', icon: IconUsers },
  { href: '/orders', key: 'orders', icon: IconReceipt },
  { href: '/allocations', key: 'allocations', icon: IconPackage },
  { href: '/procurement', key: 'procurement', icon: IconTruckDelivery },
  { href: '/replenishment', key: 'replenishment', icon: IconClipboardList },
  { href: '/withdrawals', key: 'withdrawals', icon: IconCash },
  { href: '/funds', key: 'funds', icon: IconReportMoney },
  { href: '/settlements', key: 'settlements', icon: IconWallet },
  {
    href: '/crm/contacts',
    key: 'crm',
    icon: IconAddressBook,
    children: [
      { href: '/crm/contacts', labelKey: 'crmContacts' },
      { href: '/crm/companies', labelKey: 'crmCompanies' },
      { href: '/crm/leads', labelKey: 'crmLeads' },
    ],
  },
  { href: '/settings', key: 'settings', icon: IconSettings },
];

function sectionPrefix(href: string): string {
  if (href.startsWith('/crm')) return '/crm';
  return href;
}

function AdminNav({
  pathname,
  openSections,
  toggleSection,
  role,
  permissions,
}: {
  pathname: string;
  openSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
  role?: string;
  permissions?: AdminPermission[];
}) {
  const t = useTranslations('admin.nav');
  const tc = useTranslations('common');

  const visibleItems = navItems.filter(({ key }) => {
    if (permissions?.length) {
      return permissions.includes(key as AdminPermission);
    }
    if (role) {
      return adminRoleHasPermission(role, key as AdminPermission);
    }
    return true;
  });

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{tc('platform')}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map(({ href, key, icon: Icon, children }) => {
            const label = t(key);
            const prefix = sectionPrefix(href);
            const active =
              pathname === href ||
              (prefix !== '/' && pathname.startsWith(prefix)) ||
              (children?.some((c) => pathname === c.href || pathname.startsWith(c.href)) ?? false);

            if (children?.length) {
              const open = openSections[key] ?? active;
              return (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={label}
                    onClick={() => toggleSection(key)}
                    className="justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Icon stroke={1.5} />
                      <span>{label}</span>
                    </span>
                    <IconChevronRight
                      stroke={1.5}
                      className={cn('size-4 transition-transform', open && 'rotate-90')}
                    />
                  </SidebarMenuButton>
                  {open ? (
                    <SidebarMenuSub>
                      {children.map((child) => {
                        const childActive =
                          pathname === child.href || pathname.startsWith(`${child.href}/`);
                        return (
                          <SidebarMenuSubItem key={child.href}>
                            <SidebarMenuSubButton asChild isActive={childActive}>
                              <Link href={child.href}>{t(child.labelKey)}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              );
            }

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

export function AdminShell({
  children,
  userEmail,
  role,
  permissions,
  onLogout,
  headerStart,
}: AdminShellProps) {
  const pathname = usePathname();
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const roleLabel =
    role && ['SUPER_ADMIN', 'FINANCE', 'FULFILLMENT', 'REVIEWER'].includes(role)
      ? t(`roles.${role}` as 'roles.SUPER_ADMIN')
      : role;

  const initialOpen = useMemo(
    () => ({
      crm: pathname.startsWith('/crm'),
    }),
    [pathname],
  );

  const mergedOpen = { ...initialOpen, ...openSections };

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !(prev[key] ?? initialOpen[key as keyof typeof initialOpen]) }));
  }

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
      sidebar={
        <AdminNav
          pathname={pathname}
          openSections={mergedOpen}
          toggleSection={toggleSection}
          role={role}
          permissions={permissions}
        />
      }
      headerStart={
        headerStart ?? (
          <span className="text-sm font-medium text-muted-foreground">{tc('platform')}</span>
        )
      }
      headerEnd={
        <>
          {roleLabel ? (
            <Badge variant="secondary" className="font-normal">
              {roleLabel}
            </Badge>
          ) : null}
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
