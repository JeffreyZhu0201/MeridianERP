'use client';

import Link from 'next/link';
import {
  IconBuildingStore,
  IconMapPin,
  IconReceipt,
  IconSettings,
} from '@tabler/icons-react';
import { cn } from '../../lib/utils';

export type StoreAccountSection = 'orders' | 'addresses' | 'settings' | 'becomeMerchant';

export interface StoreAccountSidebarProps {
  active?: StoreAccountSection;
  navLabel?: string;
  showBecomeMerchant?: boolean;
  labels: {
    orders: string;
    addresses: string;
    settings: string;
    becomeMerchant?: string;
  };
  className?: string;
}

const NAV_ITEMS: Array<{
  id: StoreAccountSection;
  href: string;
  icon: typeof IconReceipt;
}> = [
  { id: 'orders', href: '/shop/account', icon: IconReceipt },
  { id: 'addresses', href: '/shop/account/addresses', icon: IconMapPin },
  { id: 'settings', href: '/shop/account/settings', icon: IconSettings },
];

/**
 * Account sidebar navigation — stich.md Orders / Addresses / Settings.
 */
export function StoreAccountSidebar({
  active = 'orders',
  navLabel = 'Account',
  showBecomeMerchant = false,
  labels,
  className,
}: StoreAccountSidebarProps) {
  return (
    <aside className={cn('w-full shrink-0 md:w-64', className)}>
      <nav
        aria-label={navLabel}
        className="store-bento-card sticky top-24 p-2"
      >
        {NAV_ITEMS.map(({ id, href, icon: Icon }) => {
          const isActive = active === id;
          return (
            <Link
              key={id}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'store-label flex min-h-11 w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-muted/60',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-5 shrink-0" stroke={isActive ? 2 : 1.5} />
              {labels[id]}
            </Link>
          );
        })}

        {showBecomeMerchant && labels.becomeMerchant ? (
          <Link
            href="/open-shop"
            className={cn(
              'store-label flex min-h-11 w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-muted/60',
              active === 'becomeMerchant'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground',
            )}
          >
            <IconBuildingStore className="size-5 shrink-0" stroke={1.5} />
            {labels.becomeMerchant}
          </Link>
        ) : null}
      </nav>
    </aside>
  );
}
