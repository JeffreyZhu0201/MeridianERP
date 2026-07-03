'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@meridian/ui';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'ALL'] as const;

export function ReplenishmentStatusTabs() {
  const t = useTranslations('admin.replenishment');
  const searchParams = useSearchParams();
  const current = searchParams.get('status') ?? 'PENDING';

  function hrefFor(status: (typeof STATUSES)[number]) {
    const params = new URLSearchParams();
    if (status !== 'PENDING') params.set('status', status);
    const query = params.toString();
    return query ? `/replenishment?${query}` : '/replenishment';
  }

  const labelFor = (status: (typeof STATUSES)[number]) => {
    if (status === 'PENDING') return t('tabs.pending');
    if (status === 'APPROVED') return t('tabs.approved');
    if (status === 'REJECTED') return t('tabs.rejected');
    if (status === 'FULFILLED') return t('tabs.fulfilled');
    return t('tabs.all');
  };

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((status) => {
        const active =
          current === status || (status === 'PENDING' && !searchParams.get('status'));
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
