'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input, Label, Select } from '@meridian/ui';
import { OnboardingStatus } from '@meridian/shared';

export function MerchantsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('admin.merchants');
  const tc = useTranslations('common');

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/merchants?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="space-y-2">
        <Label htmlFor="status">{t('filterStatus')}</Label>
        <Select
          id="status"
          value={searchParams.get('status') ?? ''}
          onChange={(e) => update('status', e.target.value)}
        >
          <option value="">{t('allStatuses')}</option>
          <option value={OnboardingStatus.SUBMITTED}>{t('statusSubmitted')}</option>
          <option value={OnboardingStatus.UNDER_REVIEW}>{t('statusUnderReview')}</option>
          <option value={OnboardingStatus.APPROVED}>{t('statusApproved')}</option>
          <option value={OnboardingStatus.REJECTED}>{t('statusRejected')}</option>
        </Select>
      </div>
      <div className="flex-1 space-y-2">
        <Label htmlFor="search">{tc('search')}</Label>
        <Input
          id="search"
          placeholder={t('search')}
          defaultValue={searchParams.get('search') ?? ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              update('search', (e.target as HTMLInputElement).value);
            }
          }}
        />
      </div>
    </div>
  );
}
