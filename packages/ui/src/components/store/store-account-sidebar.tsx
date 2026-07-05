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
    comingSoon: string;
    becomeMerchant?: string;
  };
  className?: string;
}

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
  const items = [
    {
      id: 'orders' as const,
      label: labels.orders,
      icon: IconReceipt,
      enabled: true,
      href: undefined as string | undefined,
    },
    {
      id: 'addresses' as const,
      label: labels.addresses,
      icon: IconMapPin,
      enabled: false,
      href: undefined as string | undefined,
    },
    {
      id: 'settings' as const,
      label: labels.settings,
      icon: IconSettings,
      enabled: false,
      href: undefined as string | undefined,
    },
  ];

  return (
    <aside className={cn('w-full shrink-0 md:w-64', className)}>
      <nav
        aria-label={navLabel}
        className="store-bento-card sticky top-24 p-2"
      >
        {items.map(({ id, label, icon: Icon, enabled }) => {
          const isActive = active === id;
          const itemClass = cn(
            'store-label flex min-h-11 w-full items-center gap-3 rounded-lg px-4 py-3 text-left',
            isActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground',
          );

          if (!enabled) {
            return (
              <button
                key={id}
                type="button"
                disabled
                title={labels.comingSoon}
                aria-disabled="true"
                className={cn(itemClass, 'cursor-not-allowed opacity-60')}
              >
                <Icon className="size-5 shrink-0" stroke={1.5} />
                {label}
              </button>
            );
          }

          return (
            <div
              key={id}
              aria-current={isActive ? 'page' : undefined}
              className={itemClass}
            >
              <Icon className="size-5 shrink-0" stroke={isActive ? 2 : 1.5} />
              {label}
            </div>
          );
        })}

        {showBecomeMerchant && labels.becomeMerchant ? (
          <Link
            href="/open-shop"
            className={cn(
              'store-label flex min-h-11 w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-muted',
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
