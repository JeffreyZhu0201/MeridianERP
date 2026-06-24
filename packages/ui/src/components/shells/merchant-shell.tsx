'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import {
  IconAddressBook,
  IconBuilding,
  IconCategory,
  IconLayoutDashboard,
  IconPackage,
  IconSettings,
  IconTarget,
  IconUsersGroup,
} from '@tabler/icons-react';
import { cn } from '../../lib/utils';

export interface MerchantShellProps {
  children: ReactNode;
  businessName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

const mainNav = [
  { href: '/', label: 'Dashboard', icon: IconLayoutDashboard },
  {
    href: '/crm/contacts',
    label: 'CRM',
    icon: IconAddressBook,
    children: [
      { href: '/crm/contacts', label: 'Contacts', icon: IconAddressBook },
      { href: '/crm/companies', label: 'Companies', icon: IconBuilding },
      { href: '/crm/leads', label: 'Leads', icon: IconTarget },
    ],
  },
  {
    href: '/catalog/products',
    label: 'Catalog',
    icon: IconPackage,
    children: [
      { href: '/catalog/products', label: 'Products', icon: IconPackage },
      { href: '/catalog/categories', label: 'Categories', icon: IconCategory },
    ],
  },
  { href: '/distributors', label: 'Distributors', icon: IconUsersGroup },
  { href: '/settings', label: 'Settings', icon: IconSettings },
];

export function MerchantShell({ children, businessName, userEmail, onLogout }: MerchantShellProps) {
  const pathname = usePathname();
  const [crmOpen, setCrmOpen] = useState(pathname.startsWith('/crm'));
  const [catalogOpen, setCatalogOpen] = useState(pathname.startsWith('/catalog'));

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
            {mainNav.map((item) => {
              if (item.children) {
                const sectionActive =
                  item.href.startsWith('/crm')
                    ? pathname.startsWith('/crm')
                    : pathname.startsWith('/catalog');
                const isCrm = item.href.startsWith('/crm');
                const isOpen = isCrm ? crmOpen : catalogOpen;
                const toggle = () => (isCrm ? setCrmOpen(!crmOpen) : setCatalogOpen(!catalogOpen));

                return (
                  <div key={item.href}>
                    <button
                      type="button"
                      onClick={toggle}
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
                              'rounded-md px-3 py-1.5 text-sm',
                              pathname === child.href
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted',
                            )}
                          >
                            {child.label}
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
                  key={item.href}
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
