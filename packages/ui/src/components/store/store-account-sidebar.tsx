import {
  IconMapPin,
  IconReceipt,
  IconSettings,
} from '@tabler/icons-react';
import { cn } from '../../lib/utils';

export type StoreAccountSection = 'orders' | 'addresses' | 'settings';

export interface StoreAccountSidebarProps {
  active?: StoreAccountSection;
  navLabel?: string;
  labels: {
    orders: string;
    addresses: string;
    settings: string;
    comingSoon: string;
  };
  className?: string;
}

/**
 * Account sidebar navigation — stich.md Orders / Addresses / Settings.
 */
export function StoreAccountSidebar({
  active = 'orders',
  navLabel = 'Account',
  labels,
  className,
}: StoreAccountSidebarProps) {
  const items = [
    {
      id: 'orders' as const,
      label: labels.orders,
      icon: IconReceipt,
      enabled: true,
    },
    {
      id: 'addresses' as const,
      label: labels.addresses,
      icon: IconMapPin,
      enabled: false,
    },
    {
      id: 'settings' as const,
      label: labels.settings,
      icon: IconSettings,
      enabled: false,
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
      </nav>
    </aside>
  );
}
