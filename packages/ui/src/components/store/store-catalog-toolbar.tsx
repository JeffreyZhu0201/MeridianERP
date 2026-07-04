'use client';

import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconCheck,
  IconFilter,
  IconLoader2,
  IconSearch,
  IconSortDescending,
  IconX,
} from '@tabler/icons-react';
import {
  buildCatalogQueryString,
  type StoreCatalogFilterCategory,
  type StoreCatalogQuery,
  type StoreCatalogSort,
} from '@meridian/shared';
import { cn } from '../../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export type StoreCatalogNavSource = 'search' | 'filter' | 'sort';

export interface StoreCatalogToolbarProps {
  title?: string;
  basePath: string;
  categories?: StoreCatalogFilterCategory[];
  current?: StoreCatalogQuery;
  sortLabels: Record<StoreCatalogSort, string>;
  filterLabel: string;
  sortLabel: string;
  searchPlaceholder: string;
  clearSearchLabel: string;
  searchingLabel: string;
  allCategoriesLabel: string;
  inStockOnlyLabel: string;
  searchLoading?: boolean;
  onDebouncingChange?: (debouncing: boolean) => void;
  onNavigateStart?: (navigate: () => void, source: StoreCatalogNavSource) => void;
  className?: string;
}

function MenuCheck({ selected }: { selected: boolean }) {
  return (
    <IconCheck
      className={cn('size-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')}
      stroke={2}
      aria-hidden
    />
  );
}

/**
 * Catalog toolbar — search, filter, and sort wired via URL search params.
 */
export function StoreCatalogToolbar({
  title = 'All Products',
  basePath,
  categories = [],
  current = {},
  sortLabels,
  filterLabel,
  sortLabel,
  searchPlaceholder,
  clearSearchLabel,
  searchingLabel,
  allCategoriesLabel,
  inStockOnlyLabel,
  searchLoading = false,
  onDebouncingChange,
  onNavigateStart,
  className,
}: StoreCatalogToolbarProps) {
  const router = useRouter();
  const [searchDraft, setSearchDraft] = useState(current.q ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchDraft(current.q ?? '');
  }, [current.q]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const activeCategory = categories.find((c) => c.slug === current.category);
  const filterActive = Boolean(current.category || current.inStock);
  const sortActive = Boolean(current.sort && current.sort !== 'newest');
  const searchActive = Boolean(current.q);
  const showSearchSpinner = searchLoading;

  function runNavigation(patch: Partial<StoreCatalogQuery>, source: StoreCatalogNavSource) {
    const href = `${basePath}${buildCatalogQueryString(current, patch)}`;
    const navigate = () => router.push(href);
    if (onNavigateStart) {
      onNavigateStart(navigate, source);
    } else {
      navigate();
    }
  }

  function setDebouncing(debouncing: boolean) {
    onDebouncingChange?.(debouncing);
  }

  function scheduleSearchQuery(nextQuery: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setDebouncing(true);
    debounceRef.current = setTimeout(() => {
      setDebouncing(false);
      const trimmed = nextQuery.trim();
      runNavigation({ q: trimmed || undefined }, 'search');
    }, 300);
  }

  function handleSearchChange(value: string) {
    setSearchDraft(value);
    scheduleSearchQuery(value);
  }

  function clearSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setDebouncing(false);
    setSearchDraft('');
    runNavigation({ q: undefined }, 'search');
  }

  const triggerClass =
    'store-label inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 py-2 transition-colors hover:bg-muted/50';

  return (
    <div className={cn('mb-6 space-y-4 border-b border-border pb-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="store-headline-lg text-foreground">{title}</h3>
        <div className="flex flex-wrap gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(triggerClass, filterActive && 'border-primary text-primary')}
              aria-label={filterLabel}
            >
              <IconFilter className="size-4 shrink-0" stroke={1.5} />
              {filterLabel}
              {activeCategory ? `: ${activeCategory.name}` : null}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <p className="store-label px-2 py-1.5 text-muted-foreground">{filterLabel}</p>
              <DropdownMenuItem
                className="gap-2"
                onClick={() =>
                  runNavigation({ category: undefined, inStock: current.inStock }, 'filter')
                }
              >
                <MenuCheck selected={!current.category} />
                {allCategoriesLabel}
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category.slug}
                  className="gap-2"
                  onClick={() => runNavigation({ category: category.slug }, 'filter')}
                >
                  <MenuCheck selected={current.category === category.slug} />
                  {category.name} ({category.count})
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2"
                onClick={() =>
                  runNavigation(
                    { inStock: current.inStock ? undefined : true },
                    'filter',
                  )
                }
              >
                <MenuCheck selected={Boolean(current.inStock)} />
                {inStockOnlyLabel}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(triggerClass, sortActive && 'border-primary text-primary')}
              aria-label={sortLabel}
            >
              <IconSortDescending className="size-4 shrink-0" stroke={1.5} />
              {sortLabel}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <p className="store-label px-2 py-1.5 text-muted-foreground">{sortLabel}</p>
              {(Object.keys(sortLabels) as StoreCatalogSort[]).map((sort) => {
                const selected =
                  current.sort === sort || (!current.sort && sort === 'newest');
                return (
                  <DropdownMenuItem
                    key={sort}
                    className="gap-2"
                    onClick={() => runNavigation({ sort }, 'sort')}
                  >
                    <MenuCheck selected={selected} />
                    {sortLabels[sort]}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative max-w-md">
        {showSearchSpinner ? (
          <IconLoader2
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin text-primary motion-reduce:animate-none"
            stroke={1.75}
            aria-hidden
          />
        ) : (
          <IconSearch
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            stroke={1.5}
            aria-hidden
          />
        )}
        <input
          type="search"
          value={searchDraft}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          aria-busy={showSearchSpinner}
          className={cn(
            'store-label h-11 w-full rounded-full border border-border bg-background pr-10 pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
            (searchActive || showSearchSpinner) && 'border-primary',
          )}
        />
        {showSearchSpinner ? (
          <span className="sr-only">{searchingLabel}</span>
        ) : null}
        {searchDraft ? (
          <button
            type="button"
            onClick={clearSearch}
            aria-label={clearSearchLabel}
            className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <IconX className="size-4" stroke={1.5} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export interface StoreCatalogExplorerProps
  extends Omit<
    StoreCatalogToolbarProps,
    'searchLoading' | 'onDebouncingChange' | 'onNavigateStart'
  > {
  children: ReactNode;
}

/**
 * Wraps catalog toolbar + results with shared search navigation loading state.
 */
export function StoreCatalogExplorer({ children, ...toolbarProps }: StoreCatalogExplorerProps) {
  const [isPending, startTransition] = useTransition();
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [navSource, setNavSource] = useState<StoreCatalogNavSource | null>(null);

  const searchLoading =
    isDebouncing || (isPending && navSource === 'search');

  useEffect(() => {
    if (!isPending) {
      setNavSource(null);
    }
  }, [isPending]);

  function onNavigateStart(navigate: () => void, source: StoreCatalogNavSource) {
    setNavSource(source);
    startTransition(navigate);
  }

  return (
    <>
      <StoreCatalogToolbar
        {...toolbarProps}
        searchLoading={searchLoading}
        onDebouncingChange={setIsDebouncing}
        onNavigateStart={onNavigateStart}
      />
      <div
        aria-busy={searchLoading}
        aria-live="polite"
        className={cn(
          'relative transition-opacity duration-200 motion-reduce:transition-none',
          searchLoading && 'pointer-events-none opacity-50',
        )}
      >
        {searchLoading ? (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 top-8 z-10 flex justify-center"
              aria-hidden
            >
              <IconLoader2
                className="size-7 animate-spin text-primary motion-reduce:animate-none"
                stroke={1.75}
              />
            </div>
            <span className="sr-only">{toolbarProps.searchingLabel}</span>
          </>
        ) : null}
        {children}
      </div>
    </>
  );
}
