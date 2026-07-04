import { IconFilter, IconSortDescending } from '@tabler/icons-react';
import { cn } from '../../lib/utils';

export interface StoreCatalogToolbarProps {
  title?: string;
  className?: string;
}

/**
 * Catalog section toolbar — visual-only filter/sort per stich.md (API not wired).
 */
export function StoreCatalogToolbar({
  title = 'All Products',
  className,
}: StoreCatalogToolbarProps) {
  return (
    <div
      className={cn(
        'mb-6 flex items-center justify-between border-b border-border pb-3',
        className,
      )}
    >
      <h3 className="store-headline-lg text-foreground">{title}</h3>
      <div className="flex gap-3">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Coming soon"
          className="store-label inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-muted-foreground opacity-60"
        >
          <IconFilter className="size-4" stroke={1.5} />
          Filter
        </button>
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Coming soon"
          className="store-label inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-muted-foreground opacity-60"
        >
          <IconSortDescending className="size-4" stroke={1.5} />
          Sort
        </button>
      </div>
    </div>
  );
}
