'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Label, Select } from '@meridian/ui';

import type { PlatformDistributor } from '@/lib/api';
import { WithdrawalsStatusTabs } from './withdrawals-status-tabs';

interface WithdrawalsToolbarProps {
  distributors: PlatformDistributor[];
}

export function WithdrawalsToolbar({ distributors }: WithdrawalsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('admin.withdrawals');
  const currentDistributor = searchParams.get('distributorId') ?? '';

  function onDistributorChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('distributorId', value);
    } else {
      params.delete('distributorId');
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-4">
      <WithdrawalsStatusTabs />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Label htmlFor="withdrawal-distributor-filter">{t('filterDistributor')}</Label>
          <Select
            id="withdrawal-distributor-filter"
            value={currentDistributor}
            onChange={(e) => onDistributorChange(e.target.value)}
            className="min-w-[220px]"
          >
            <option value="">{t('allDistributors')}</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
