'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input, Label, Select } from '@meridian/ui';
import { OnboardingStatus } from '@meridian/shared';

export function MerchantsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
        <Label htmlFor="status">Status</Label>
        <Select
          id="status"
          value={searchParams.get('status') ?? ''}
          onChange={(e) => update('status', e.target.value)}
        >
          <option value="">All</option>
          <option value={OnboardingStatus.SUBMITTED}>Submitted</option>
          <option value={OnboardingStatus.UNDER_REVIEW}>Under Review</option>
          <option value={OnboardingStatus.APPROVED}>Approved</option>
          <option value={OnboardingStatus.REJECTED}>Rejected</option>
        </Select>
      </div>
      <div className="flex-1 space-y-2">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Search by business name or email"
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
