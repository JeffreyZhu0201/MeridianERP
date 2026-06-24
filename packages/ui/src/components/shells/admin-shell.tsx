'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import {
  IconBuildingStore,
  IconLayoutDashboard,
  IconReceipt,
  IconSettings,
  IconWallet,
} from '@tabler/icons-react';
import { cn } from '../../lib/utils';

export interface AdminShellProps {
  children: ReactNode;
  userEmail?: string;
  onLogout?: () => void;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: IconLayoutDashboard },
  { href: '/merchants', label: 'Merchants', icon: IconBuildingStore },
  { href: '/orders', label: 'Orders', icon: IconReceipt },
  { href: '/settlements', label: 'Settlements', icon: IconWallet },
  { href: '/settings', label: 'Settings', icon: IconSettings },
];

export function AdminShell({ children, userEmail, onLogout }: AdminShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-md p-2 hover:bg-muted lg:hidden"
            aria-label="Toggle sidebar"
          >
            <span className="sr-only">Menu</span>
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-lg font-semibold tracking-tight">MeridianERP Admin</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-muted-foreground sm:inline">Platform</span>
          {userEmail ? (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{userEmail}</span>
              {onLogout ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-full px-3 py-1 text-sm hover:bg-muted"
                >
                  Sign out
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>
      <div className="flex flex-1">
        <aside
          className={cn(
            'hidden border-r bg-muted/30 transition-[width] duration-200 ease-out lg:block',
            collapsed ? 'w-12' : 'w-64',
          )}
        >
          <nav className="flex flex-col gap-1 p-3">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="size-5 shrink-0" stroke={1.5} />
                  {!collapsed ? <span>{label}</span> : null}
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
