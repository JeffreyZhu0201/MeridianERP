'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Button, Input, Select } from '@meridian/ui';
import { LedgerStatus } from '@meridian/shared';

import type { Distributor } from '@/lib/api';
import { defaultDateRange } from '@/lib/commissions';

interface CommissionsFiltersProps {
  distributors: Distributor[];
}

export function CommissionsFilters({ distributors }: CommissionsFiltersProps) {
  const t = useTranslations('merchant.commissions.filters');
  const tc = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const defaults = defaultDateRange();
  const distributorId = searchParams.get('distributorId') ?? '';
  const status = searchParams.get('status') ?? '';
  const from = searchParams.get('from') ?? defaults.from;
  const to = searchParams.get('to') ?? defaults.to;

  function applyFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete('page');
    startTransition(() => {
      router.push(`/commissions?${params.toString()}`);
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    applyFilters({
      distributorId: String(form.get('distributorId') ?? ''),
      status: String(form.get('status') ?? ''),
      from: String(form.get('from') ?? ''),
      to: String(form.get('to') ?? ''),
    });
  }

  function handleReset() {
    startTransition(() => {
      router.push('/commissions');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label htmlFor="distributorId" className="text-xs text-muted-foreground">
          {t('distributor')}
        </label>
        <Select
          id="distributorId"
          name="distributorId"
          defaultValue={distributorId}
          className="min-w-[180px]"
        >
          <option value="">{t('allDistributors')}</option>
          {distributors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <label htmlFor="status" className="text-xs text-muted-foreground">
          {tc('status')}
        </label>
        <Select id="status" name="status" defaultValue={status} className="min-w-[140px]">
          <option value="">{t('allStatuses')}</option>
          <option value={LedgerStatus.ACCRUED}>{t('accrued')}</option>
          <option value={LedgerStatus.SETTLED}>{t('settled')}</option>
        </Select>
      </div>

      <div className="space-y-1">
        <label htmlFor="from" className="text-xs text-muted-foreground">
          {tc('from')}
        </label>
        <Input id="from" name="from" type="date" defaultValue={from} className="w-[160px]" />
      </div>

      <div className="space-y-1">
        <label htmlFor="to" className="text-xs text-muted-foreground">
          {tc('to')}
        </label>
        <Input id="to" name="to" type="date" defaultValue={to} className="w-[160px]" />
      </div>

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? tc('applying') : tc('apply')}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={handleReset} disabled={isPending}>
        {tc('reset')}
      </Button>
    </form>
  );
}
