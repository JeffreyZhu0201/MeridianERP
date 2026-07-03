'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@meridian/ui';

import type { UserIdentity } from '@meridian/shared';

const IDENTITIES: UserIdentity[] = [
  'CONSUMER',
  'MERCHANT_OWNER',
  'MERCHANT_STAFF',
  'DISTRIBUTOR',
  'PLATFORM_ADMIN',
];

export function UsersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('admin.users');
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const identity = searchParams.get('identity') ?? '';

  function applyFilters(nextSearch: string, nextIdentity: string) {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set('search', nextSearch.trim());
    if (nextIdentity) params.set('identity', nextIdentity);
    params.set('page', '1');
    router.push(`/users?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="user-search">{t('search')}</Label>
        <Input
          id="user-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applyFilters(search, identity);
          }}
        />
      </div>
      <div className="w-full space-y-2 sm:w-56">
        <Label>{t('filterIdentity')}</Label>
        <Select
          value={identity || 'all'}
          onValueChange={(value) => applyFilters(search, value === 'all' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('allIdentities')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allIdentities')}</SelectItem>
            {IDENTITIES.map((id) => (
              <SelectItem key={id} value={id}>
                {t(`identities.${id}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" onClick={() => applyFilters(search, identity)}>
        {t('search')}
      </Button>
    </div>
  );
}
