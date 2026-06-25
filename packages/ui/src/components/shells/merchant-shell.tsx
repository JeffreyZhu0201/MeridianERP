'use client';

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
  IconUsersGroup,
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

export interface MerchantShellProps {
  children: ReactNode;
  businessName?: string;
  userEmail?: string;
  onLogout?: () => void;
  lowStockAlertCount?: number;
}

type NavChild = { href: string; labelKey: string; badge?: number };
type NavItem = {
  key: string;
  href: string;
  labelKey: string;
  icon: typeof IconLayoutDashboard;
  children?: NavChild[];
};

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
  { key: 'distributors', href: '/distributors', labelKey: 'distributors', icon: IconUsersGroup },
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
