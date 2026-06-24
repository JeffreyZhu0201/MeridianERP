'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useMemo, useState } from 'react';
import {
  IconAddressBook,
  IconBuildingWarehouse,
  IconLayoutDashboard,
  IconPackage,
  IconSettings,
  IconUsersGroup,
} from '@tabler/icons-react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export interface MerchantShellProps {
  children: ReactNode;
  businessName?: string;
  userEmail?: string;
  onLogout?: () => void;
  lowStockAlertCount?: number;
}

type NavChild = { href: string; label: string; badge?: number };
type NavItem = {
  key: string;
  href: string;
  label: string;
  icon: typeof IconLayoutDashboard;
  children?: NavChild[];
};

const mainNav: NavItem[] = [
  { key: 'dashboard', href: '/', label: 'Dashboard', icon: IconLayoutDashboard },
  {
    key: 'crm',
    href: '/crm/contacts',
    label: 'CRM',
    icon: IconAddressBook,
    children: [
      { href: '/crm/contacts', label: 'Contacts' },
      { href: '/crm/companies', label: 'Companies' },
      { href: '/crm/leads', label: 'Leads' },
    ],
  },
  {
    key: 'catalog',
    href: '/catalog/products',
    label: 'Catalog',
    icon: IconPackage,
    children: [
      { href: '/catalog/products', label: 'Products' },
      { href: '/catalog/categories', label: 'Categories' },
    ],
  },
  {
    key: 'inventory',
    href: '/inventory/warehouses',
    label: 'Inventory',
    icon: IconBuildingWarehouse,
    children: [
      { href: '/inventory/warehouses', label: 'Warehouses' },
      { href: '/inventory/stock', label: 'Stock levels' },
      { href: '/inventory/adjustments', label: 'Adjustments' },
      { href: '/inventory/alerts', label: 'Alerts' },
      { href: '/inventory/purchase-orders', label: 'Purchase orders' },
      { href: '/inventory/reports', label: 'Reports' },
      { href: '/inventory/settings', label: 'Settings' },
    ],
  },
  { key: 'distributors', href: '/distributors', label: 'Distributors', icon: IconUsersGroup },
  { key: 'settings', href: '/settings', label: 'Settings', icon: IconSettings },
];

function sectionPrefix(href: string): string {
  if (href.startsWith('/crm')) return '/crm';
  if (href.startsWith('/catalog')) return '/catalog';
  if (href.startsWith('/inventory')) return '/inventory';
  return href;
}

export function MerchantShell({
  children,
  businessName,
  userEmail,
  onLogout,
  lowStockAlertCount,
}: MerchantShellProps) {
  const pathname = usePathname();

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
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4">
        <span className="text-lg font-semibold tracking-tight">
          {businessName ?? 'MeridianERP'}
        </span>
        <div className="flex items-center gap-2 text-sm">
          {userEmail ? <span className="text-muted-foreground">{userEmail}</span> : null}
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full px-3 py-1 hover:bg-muted"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-muted/30 lg:block">
          <nav className="flex flex-col gap-1 p-3">
            {navWithBadges.map((item) => {
              if (item.children) {
                const sectionActive = pathname.startsWith(sectionPrefix(item.href));
                const isOpen = openSections[item.key] ?? false;

                return (
                  <div key={item.key}>
                    <button
                      type="button"
                      onClick={() => toggleSection(item.key)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                        sectionActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted',
                      )}
                    >
                      <item.icon className="size-5" stroke={1.5} />
                      <span className="flex-1 text-left">{item.label}</span>
                      <span className="text-xs">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen ? (
                      <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-2">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'flex items-center justify-between rounded-md px-3 py-1.5 text-sm',
                              pathname === child.href || pathname.startsWith(`${child.href}/`)
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted',
                            )}
                          >
                            <span>{child.label}</span>
                            {child.badge ? (
                              <Badge variant="destructive" className="h-5 min-w-5 px-1 text-xs">
                                {child.badge}
                              </Badge>
                            ) : null}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              }

              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <item.icon className="size-5" stroke={1.5} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
