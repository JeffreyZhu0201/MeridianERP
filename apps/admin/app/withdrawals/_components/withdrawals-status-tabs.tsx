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
    params.delete('tab');
    params.delete('ledgerPage');
    params.delete('ledgerStatus');
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
    <div
      className="flex flex-wrap gap-2 rounded-xl bg-muted/50 p-1 ring-1 ring-border"
      role="tablist"
      aria-label={t('statusFilter')}
    >
      {STATUSES.map((status) => {
        const active = current === status || (status === 'PENDING' && !searchParams.get('status'));
        return (
          <Link
            key={status}
            href={hrefFor(status)}
            role="tab"
            aria-selected={active}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {labelFor(status)}
          </Link>
        );
      })}
      {distributorId ? (
        <Link
          href="/withdrawals"
          className="ml-auto self-center text-sm text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1"
        >
          {t('clearDistributorFilter')}
        </Link>
      ) : null}
    </div>
  );
}
