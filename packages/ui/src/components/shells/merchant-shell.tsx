'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  IconAddressBook,
  IconBuildingWarehouse,
  IconChevronRight,
  IconClipboardList,
  IconHeadset,
  IconLayoutDashboard,
  IconMessages,
  IconPackage,
  IconPuzzle,
  IconReceipt,
  IconReceiptTax,
  IconSettings,
  IconUsers,
  IconWallet,
  IconWritingSign,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import type { MerchantPluginCode } from '@meridian/shared';
import { ErpShell } from '../frameworks/erp-shell';
import { ShellUserChip } from './shell-user-chip';
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
  businessNameLoading?: boolean;
  userDisplayName?: string;
  userEmail?: string;
  userLoading?: boolean;
  onLogout?: () => void;
  lowStockAlertCount?: number;
  installedPluginCodes?: MerchantPluginCode[];
}

type NavChild = { href: string; labelKey: string; badge?: number };
type NavItem = {
  key: string;
  href: string;
  labelKey: string;
  icon: typeof IconLayoutDashboard;
  pluginCode?: MerchantPluginCode;
  children?: NavChild[];
};

const coreNav: NavItem[] = [
  { key: 'dashboard', href: '/', labelKey: 'dashboard', icon: IconLayoutDashboard },
  {
    key: 'crm',
    href: '/crm/contacts',
    labelKey: 'crm',
    icon: IconAddressBook,
    pluginCode: 'crm',
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
    href: '/inventory/stock',
    labelKey: 'inventory',
    icon: IconBuildingWarehouse,
    children: [
      { href: '/inventory/stock', labelKey: 'inventoryStock' },
      { href: '/inventory/adjustments', labelKey: 'inventoryAdjustments' },
      { href: '/inventory/alerts', labelKey: 'inventoryAlerts' },
      { href: '/inventory/procurement', labelKey: 'inventoryProcurementShop' },
      { href: '/inventory/procurement/history', labelKey: 'inventoryProcurementHistory' },
      { href: '/inventory/reports', labelKey: 'inventoryReports' },
      { href: '/inventory/settings', labelKey: 'inventorySettings' },
    ],
  },
  { key: 'orders', href: '/orders', labelKey: 'orders', icon: IconReceipt },
  { key: 'funds', href: '/funds', labelKey: 'funds', icon: IconWallet },
];

const pluginNav: NavItem[] = [
  { key: 'hrm', href: '/hrm', labelKey: 'hrm', icon: IconUsers, pluginCode: 'hrm' },
  { key: 'im', href: '/im', labelKey: 'im', icon: IconMessages, pluginCode: 'im' },
  {
    key: 'finance-tax',
    href: '/finance-tax',
    labelKey: 'financeTax',
    icon: IconReceiptTax,
    pluginCode: 'finance_tax',
  },
  { key: 'oa', href: '/oa', labelKey: 'oa', icon: IconClipboardList, pluginCode: 'oa' },
  {
    key: 'e-signature',
    href: '/e-signature',
    labelKey: 'eSignature',
    icon: IconWritingSign,
    pluginCode: 'e_signature',
  },
  {
    key: 'customer-service',
    href: '/customer-service',
    labelKey: 'customerService',
    icon: IconHeadset,
    pluginCode: 'customer_service',
  },
];

const tailNav: NavItem[] = [
  { key: 'plugins', href: '/plugins', labelKey: 'plugins', icon: IconPuzzle },
  { key: 'settings', href: '/settings', labelKey: 'settings', icon: IconSettings },
];

function sectionPrefix(href: string): string {
  if (href.startsWith('/crm')) return '/crm';
  if (href.startsWith('/catalog')) return '/catalog';
  if (href.startsWith('/inventory')) return '/inventory';
  return href;
}

function filterNav(items: NavItem[], installed: Set<string>): NavItem[] {
  return items.filter((item) => !item.pluginCode || installed.has(item.pluginCode));
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
  businessNameLoading = false,
  userDisplayName,
  userEmail,
  userLoading = false,
  onLogout,
  lowStockAlertCount,
  installedPluginCodes = [],
}: MerchantShellProps) {
  const pathname = usePathname();
  const tc = useTranslations('common');
  const ts = useTranslations('merchant.shell');
  const installed = useMemo(
    () => new Set(installedPluginCodes),
    [installedPluginCodes],
  );

  const visibleNav = useMemo(() => {
    const withPlugins = [
      ...filterNav(coreNav, installed),
      ...filterNav(pluginNav, installed),
      ...tailNav,
    ];
    return withPlugins;
  }, [installed]);

  const navWithBadges = useMemo(() => {
    return visibleNav.map((item) => {
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
  }, [visibleNav, lowStockAlertCount]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => ({
    crm: pathname.startsWith('/crm'),
    catalog: pathname.startsWith('/catalog'),
    inventory: pathname.startsWith('/inventory'),
  }));

  useEffect(() => {
    setOpenSections((prev) => ({
      ...prev,
      crm: pathname.startsWith('/crm') || prev.crm,
      catalog: pathname.startsWith('/catalog') || prev.catalog,
      inventory: pathname.startsWith('/inventory') || prev.inventory,
    }));
  }, [pathname]);

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const sidebarTitle = businessName
    ? businessName
    : businessNameLoading
      ? '…'
      : ts('defaultBusinessName');
  const sidebarInitial = businessName?.charAt(0)?.toUpperCase() ?? (businessNameLoading ? '…' : 'M');

  return (
    <ErpShell
      portal="merchant"
      sidebarHeader={
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold">{sidebarInitial}</span>
          </div>
          <span className="truncate font-semibold tracking-tight">{sidebarTitle}</span>
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
          <ShellUserChip
            displayName={userDisplayName}
            email={userEmail}
            loading={userLoading}
            href="/settings"
            ariaLabel={ts('openSettings')}
          />
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
