'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Label, Select } from '@meridian/ui';

import type { PlatformDistributor } from '@/lib/api';

interface WithdrawalsDistributorFilterProps {
  distributors: PlatformDistributor[];
}

export function WithdrawalsDistributorFilter({ distributors }: WithdrawalsDistributorFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('admin.withdrawals');
  const current = searchParams.get('distributorId') ?? '';

  function onChange(value: string) {
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
    <div className="space-y-2">
      <Label htmlFor="withdrawal-distributor-filter">{t('filterDistributor')}</Label>
      <Select
        id="withdrawal-distributor-filter"
        value={current}
        onChange={(e) => onChange(e.target.value)}
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
  );
}
