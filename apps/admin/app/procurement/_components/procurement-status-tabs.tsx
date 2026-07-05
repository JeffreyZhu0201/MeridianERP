'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@meridian/ui';
import { PLATFORM_PROCUREMENT_TAB_STATUSES } from '@meridian/shared';

export function ProcurementStatusTabs() {
  const t = useTranslations('admin.procurement');
  const searchParams = useSearchParams();
  const current = searchParams.get('status') ?? 'PROCESSING';

  function hrefFor(status: (typeof PLATFORM_PROCUREMENT_TAB_STATUSES)[number]) {
    const params = new URLSearchParams();
    if (status !== 'PROCESSING') params.set('status', status);
    const query = params.toString();
    return query ? `/procurement?${query}` : '/procurement';
  }

  const labelFor = (status: (typeof PLATFORM_PROCUREMENT_TAB_STATUSES)[number]) => {
    if (status === 'PROCESSING') return t('tabs.processing');
    if (status === 'SHIPPED') return t('tabs.shipped');
    if (status === 'RECEIVED') return t('tabs.received');
    return t('tabs.all');
  };

  return (
    <div className="flex flex-wrap gap-2">
      {PLATFORM_PROCUREMENT_TAB_STATUSES.map((status) => {
        const active =
          current === status || (status === 'PROCESSING' && !searchParams.get('status'));
        return (
          <Link
            key={status}
            href={hrefFor(status)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm transition-colors',
              active
                ? 'bg-muted font-medium text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            {labelFor(status)}
          </Link>
        );
      })}
    </div>
  );
}
