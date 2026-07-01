'use client';

/**
 * MerchantShell - 商户分店门户布局组件
 *
 * 提供商户分店（Merchant Portal）的标准页面布局，包含：
 * - 可折叠侧边栏导航（CRM、目录、库存、订单、资金等）
 * - 低库存警告徽章（显示在库存菜单上）
 * - 顶部工具栏（商户名称、用户邮箱、退出按钮）
 * - 暗色模式与国际化切换
 *
 * @example
 * ```tsx
 * <MerchantShell
 *   businessName="星巴克 - 中关村店"
 *   userEmail="manager@starbucks.test"
 *   lowStockAlertCount={3}
 *   onLogout={() => signOut()}
 * >
 *   <InventoryPage />
 * </MerchantShell>
 * ```
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useMemo, useState } from 'react';
import {
  IconAddressBook,
  IconBuildingWarehouse,
  IconChevronRight,
  IconCoin,
  IconLayoutDashboard,
  IconPackage,
  IconReceipt,
  IconSettings,
  IconTruckDelivery,
  IconWallet,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { ErpShell } from '../frameworks/erp-shell';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
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
 * MerchantShell 属性接口
 * @param children - 页面内容
 * @param businessName - 商户/分店名称（显示在侧边栏顶部）
 * @param userEmail - 当前登录用户邮箱
 * @param onLogout - 退出登录回调函数
 * @param lowStockAlertCount - 低库存警告数量（显示在库存菜单上，红点徽章）
 */
export interface MerchantShellProps {
  children: ReactNode;
  businessName?: string;
  userEmail?: string;
  onLogout?: () => void;
  lowStockAlertCount?: number;
}

/** 导航子项类型 - 支持徽章显示 */
type NavChild = { href: string; labelKey: string; badge?: number };
/** 导航项类型 - 一级菜单 */
type NavItem = {
  key: string;
  href: string;
  labelKey: string;
  icon: typeof IconLayoutDashboard;
  children?: NavChild[];
};

/**
 * 商户导航配置
 * - dashboard: 首页/仪表盘
 * - crm: 客户关系管理（Contacts/Companies/Leads/Activities）
 * - catalog: 商品目录（Products/Categories）
 * - inventory: 库存管理（Warehouses/Stock/Adjustments/Transfers/Alerts/PurchaseOrders/Reports/Settings）
 * - orders: 订单管理
 * - allocations: 配额管理
 * - funds: 资金管理
 * - replenishment: 补货请求
 * - commissions: 佣金查看
 * - settings: 商户设置
 */
const mainNav: NavItem[] = [
  { key: 'dashboard', href: '/', labelKey: 'dashboard', icon: IconLayoutDashboard },
  {
    key: 'crm',
    href: '/crm/contacts',
    labelKey: 'crm',
    icon: IconAddressBook,
    children: [
      { href: '/crm/contacts', labelKey: 'crmContacts' },
      { href: '/crm/companies', labelKey: 'crmCompanies' },
      { href: '/crm/leads', labelKey: 'crmLeads' },
      { href: '/crm/activities', labelKey: 'crmActivities' },
    ],
  },
  {
    key: 'catalog',
    href: '/catalog/products',
    labelKey: 'catalog',
    icon: IconPackage,
    children: [
      { href: '/catalog/products', labelKey: 'catalogProducts' },
      { href: '/catalog/categories', labelKey: 'catalogCategories' },
    ],
  },
  {
    key: 'inventory',
    href: '/inventory/warehouses',
    labelKey: 'inventory',
    icon: IconBuildingWarehouse,
    children: [
      { href: '/inventory/warehouses', labelKey: 'inventoryWarehouses' },
      { href: '/inventory/stock', labelKey: 'inventoryStock' },
      { href: '/inventory/adjustments', labelKey: 'inventoryAdjustments' },
      { href: '/inventory/transfers', labelKey: 'inventoryTransfers' },
      { href: '/inventory/alerts', labelKey: 'inventoryAlerts' },
      { href: '/inventory/purchase-orders', labelKey: 'inventoryPurchaseOrders' },
      { href: '/inventory/reports', labelKey: 'inventoryReports' },
      { href: '/inventory/settings', labelKey: 'inventorySettings' },
    ],
  },
  { key: 'orders', href: '/orders', labelKey: 'orders', icon: IconReceipt },
  { key: 'allocations', href: '/allocations', labelKey: 'allocations', icon: IconPackage },
  { key: 'funds', href: '/funds', labelKey: 'funds', icon: IconWallet },
  { key: 'replenishment', href: '/replenishment', labelKey: 'replenishment', icon: IconTruckDelivery },
  { key: 'commissions', href: '/commissions', labelKey: 'commissions', icon: IconCoin },
  { key: 'settings', href: '/settings', labelKey: 'settings', icon: IconSettings },
];

function sectionPrefix(href: string): string {
  if (href.startsWith('/crm')) return '/crm';
  if (href.startsWith('/catalog')) return '/catalog';
  if (href.startsWith('/inventory')) return '/inventory';
  return href;
}

function MerchantNav({
  pathname,
  navWithBadges,
  openSections,
  toggleSection,
}: {
  pathname: string;
  navWithBadges: NavItem[];
  openSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
}) {
  const t = useTranslations('merchant.nav');
  const tc = useTranslations('common');

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{tc('navigation')}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navWithBadges.map((item) => {
            const label = t(item.labelKey);
            if (item.children) {
              const sectionActive = pathname.startsWith(sectionPrefix(item.href));
              const isOpen = openSections[item.key] ?? false;

              return (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={sectionActive}
                    onClick={() => toggleSection(item.key)}
                    tooltip={label}
                  >
                    <item.icon stroke={1.5} />
                    <span>{label}</span>
                    <IconChevronRight
                      className={cn('ml-auto size-4 transition-transform', isOpen && 'rotate-90')}
                      stroke={1.5}
                    />
                  </SidebarMenuButton>
                  {isOpen ? (
                    <SidebarMenuSub>
                      {item.children.map((child) => {
                        const childActive =
                          pathname === child.href || pathname.startsWith(`${child.href}/`);
                        return (
                          <SidebarMenuSubItem key={child.href}>
                            <SidebarMenuSubButton asChild isActive={childActive}>
                              <Link href={child.href}>
                                <span>{t(child.labelKey)}</span>
                                {child.badge ? (
                                  <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1 text-xs">
                                    {child.badge}
                                  </Badge>
                                ) : null}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              );
            }

            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton isActive={active} tooltip={label} asChild>
                  <Link href={item.href}>
                    <item.icon stroke={1.5} />
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

export function MerchantShell({
  children,
  businessName,
  userEmail,
  onLogout,
  lowStockAlertCount,
}: MerchantShellProps) {
  const pathname = usePathname();
  const tc = useTranslations('common');

  const navWithBadges = useMemo(() => {
    return mainNav.map((item) => {
      if (item.key !== 'inventory' || !item.children) return item;
      return {
        ...item,
        children: item.children.map((child) =>
          child.href === '/inventory/alerts' && lowStockAlertCount && lowStockAlertCount > 0
            ? { ...child, badge: lowStockAlertCount }
            : child,
        ),
      };
    });
  }, [lowStockAlertCount]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => ({
    crm: pathname.startsWith('/crm'),
    catalog: pathname.startsWith('/catalog'),
    inventory: pathname.startsWith('/inventory'),
  }));

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <ErpShell
      portal="merchant"
      sidebarHeader={
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold">M</span>
          </div>
          <span className="truncate font-semibold tracking-tight">
            {businessName ?? 'MeridianERP'}
          </span>
        </div>
      }
      sidebar={
        <MerchantNav
          pathname={pathname}
          navWithBadges={navWithBadges}
          openSections={openSections}
          toggleSection={toggleSection}
        />
      }
      headerEnd={
        <>
          {userEmail ? (
            <span className="hidden text-sm text-muted-foreground sm:inline">{userEmail}</span>
          ) : null}
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
