'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import {
  BentoTile,
  Button,
  EmptyState,
  Input,
  Label,
  Skeleton,
} from '@meridian/ui';
import type { PublishedStore } from '@meridian/shared';

import { apiFetch, type PublishedStoreListResponse } from '@/lib/api';
const STORAGE_KEY = 'meridian_last_store_slug';
const STORAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function readRememberedSlug(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { slug?: string; expiresAt?: number };
    if (!parsed.slug || !parsed.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.slug;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function rememberSlug(slug: string) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ slug, expiresAt: Date.now() + STORAGE_TTL_MS }),
  );
}

export function StorePicker() {
  const router = useRouter();
  const t = useTranslations('store');
  const [stores, setStores] = useState<PublishedStore[]>([]);
  const [query, setQuery] = useState('');
  const [selectedSlug, setSelectedSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStores() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch<PublishedStoreListResponse>('/store/stores');
        if (cancelled) return;
        setStores(response.items);
        const remembered = readRememberedSlug();
        if (remembered && response.items.some((store) => store.slug === remembered)) {
          setSelectedSlug(remembered);
        }
      } catch {
        if (!cancelled) {
          setError(t('home.pickerLoadError'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStores();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const filteredStores = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return stores;
    return stores.filter(
      (store) =>
        store.displayName.toLowerCase().includes(normalized) ||
        store.slug.toLowerCase().includes(normalized),
    );
  }, [query, stores]);

  function handleContinue() {
    if (!selectedSlug) return;
    rememberSlug(selectedSlug);
    router.push(`/s/${selectedSlug}`);
  }

  if (loading) {
    return (
      <BentoTile colSpan={2} className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </BentoTile>
    );
  }

  if (error) {
    return (
      <BentoTile colSpan={2} className="p-6">
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      </BentoTile>
    );
  }

  if (stores.length === 0) {
    return (
      <BentoTile colSpan={2} className="p-6">
        <EmptyState
          title={t('home.pickerEmpty')}
          description={t('home.pickerEmptyDescription')}
        />
      </BentoTile>
    );
  }

  return (
    <BentoTile colSpan={2} className="p-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="store-search">{t('home.pickerLabel')}</Label>
          <Input
            id="store-search"
            type="search"
            placeholder={t('home.pickerPlaceholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </div>

        <div
          className="max-h-64 overflow-y-auto rounded-lg ring-1 ring-border"
          role="listbox"
          aria-label={t('home.pickerLabel')}
        >
          {filteredStores.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t('home.pickerEmpty')}
            </p>
          ) : (
            filteredStores.map((store) => {
              const selected = store.slug === selectedSlug;
              return (
                <button
                  key={store.slug}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => setSelectedSlug(store.slug)}
                  className={`flex w-full flex-col items-start gap-0.5 border-b px-4 py-3 text-left text-sm last:border-b-0 hover:bg-muted/60 ${
                    selected ? 'bg-muted font-medium' : ''
                  }`}
                >
                  <span>{store.displayName}</span>
                  <span className="font-mono text-xs text-muted-foreground">/s/{store.slug}</span>
                </button>
              );
            })
          )}
        </div>

        <Button type="button" className="w-full" disabled={!selectedSlug} onClick={handleContinue}>
          {t('home.pickerContinue')}
        </Button>

        <div className="border-t pt-4 text-center">
          <Link
            href="/open-shop"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t('home.openShop')}
          </Link>
        </div>
      </div>
    </BentoTile>
  );
}
