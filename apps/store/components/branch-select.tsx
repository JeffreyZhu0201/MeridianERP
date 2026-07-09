'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Select } from '@meridian/ui';
import { FULFILLMENT_SLUG_COOKIE, type PublishedStoreListResponse } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface BranchSelectProps
{
  currentSlug: string;
}

function setFulfillmentCookie (slug: string)
{
  document.cookie = `${FULFILLMENT_SLUG_COOKIE}=${encodeURIComponent(slug)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function BranchSelect ({ currentSlug }: BranchSelectProps)
{
  const router = useRouter();
  const t = useTranslations('store.shell');
  const [stores, setStores] = useState<PublishedStoreListResponse['items']>([]);
  const [value, setValue] = useState(currentSlug);

  useEffect(() =>
  {
    apiFetch<PublishedStoreListResponse>('/store/stores')
      .then((res) => setStores(res.items))
      .catch(() => setStores([]));
  }, []);

  useEffect(() =>
  {
    setValue(currentSlug);
  }, [currentSlug]);

  function handleChange (slug: string)
  {
    setValue(slug);
    setFulfillmentCookie(slug);
    router.push('/shop');
    router.refresh();
  }

  const branchStores = stores.filter((store) => !store.isFlagship);

  if (branchStores.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="branch-select" className="sr-only">
        { t('branchSelect') }
      </label>
      <Select
        id="branch-select"
        value={ value }
        onChange={ (e) => handleChange(e.target.value) }
        className="h-9 min-w-[10rem] rounded-full border-border bg-muted/60 text-sm font-medium text-primary"
        aria-label={ t('branchSelect') }
      >
        <option value="" disabled>
          { t('branchSelectPlaceholder') }
        </option>
        { branchStores.map((store) => (
          <option key={ store.slug } value={ store.slug }>
            { store.displayName }
          </option>
        )) }
      </Select>
    </div>
  );
}
