'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@meridian/ui';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const;

export function WithdrawalsStatusTabs() {
  const t = useTranslations('admin.withdrawals');
  const searchParams = useSearchParams();
  const current = searchParams.get('status') ?? 'PENDING';
  const distributorId = searchParams.get('distributorId');

  function hrefFor(status: (typeof STATUSES)[number]) {
    const params = new URLSearchParams();
    if (status !== 'PENDING') params.set('status', status);
    if (distributorId) params.set('distributorId', distributorId);
    const query = params.toString();
    return query ? `/withdrawals?${query}` : '/withdrawals';
  }

  const labelFor = (status: (typeof STATUSES)[number]) => {
    if (status === 'PENDING') return t('tabs.pending');
    if (status === 'APPROVED') return t('tabs.approved');
    if (status === 'REJECTED') return t('tabs.rejected');
    return t('tabs.all');
  };

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((status) => {
        const active = current === status || (status === 'PENDING' && !searchParams.get('status'));
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
      {distributorId ? (
        <Link
          href="/withdrawals"
          className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t('clearDistributorFilter')}
        </Link>
      ) : null}
    </div>
  );
}
