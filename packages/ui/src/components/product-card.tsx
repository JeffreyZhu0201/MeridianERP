/**
 * ProductCard - 商品卡片组件
 *
 * variant="store" follows docs/design/stich.md consumer catalog cards.
 */

import Link from 'next/link';
import { cn } from '../lib/utils';

export interface ProductCardProps {
  name: string;
  slug: string;
  storeSlug: string;
  priceFrom: string | number;
  imageUrl?: string;
  className?: string;
  href?: string;
  outOfStock?: boolean;
  outOfStockLabel?: string;
  /** ERP default link card; store = stich bento card with CTA styling */
  variant?: 'default' | 'store';
  flagshipBadge?: string;
  addToCartLabel?: string;
}

function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

export function ProductCard({
  name,
  slug,
  storeSlug,
  priceFrom,
  imageUrl,
  className,
  href,
  outOfStock,
  outOfStockLabel = 'Out of stock',
  variant = 'default',
  flagshipBadge,
  addToCartLabel = 'Add to Cart',
}: ProductCardProps) {
  const linkHref = href ?? `/shop/products/${slug}`;

  if (variant === 'store') {
    return (
      <article
        className={cn(
          'store-bento-card group flex flex-col overflow-hidden bg-card',
          outOfStock && 'opacity-70',
          className,
        )}
      >
        <Link href={linkHref} className="relative block h-48 bg-muted/60 p-3">
          {flagshipBadge ? (
            <span className="absolute left-3 top-3 z-10 rounded bg-secondary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary">
              {flagshipBadge}
            </span>
          ) : null}
          {outOfStock ? (
            <span className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-black/30">
              <span className="rounded-full bg-destructive px-3 py-1 text-sm font-medium text-destructive-foreground">
                {outOfStockLabel}
              </span>
            </span>
          ) : null}
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className={cn(
                'mx-auto h-full w-full object-contain object-center mix-blend-multiply transition-transform duration-300',
                !outOfStock && 'group-hover:scale-105',
                outOfStock && 'grayscale',
              )}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </Link>
        <div className="flex flex-1 flex-col p-4">
          <Link href={linkHref}>
            <h3 className="store-body-md line-clamp-2 font-medium leading-snug text-foreground group-hover:text-primary">
              {name}
            </h3>
          </Link>
          <span
            className={cn(
              'store-price mt-auto pt-2',
              outOfStock && 'text-muted-foreground',
            )}
          >
            {formatPrice(priceFrom)}
          </span>
          <Link
            href={linkHref}
            className={cn(
              'store-label mt-3 block w-full rounded-full border py-2 text-center transition-colors',
              outOfStock
                ? 'cursor-not-allowed border-border bg-muted text-muted-foreground'
                : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground',
            )}
            aria-disabled={outOfStock}
            tabIndex={outOfStock ? -1 : undefined}
          >
            {outOfStock ? outOfStockLabel : addToCartLabel}
          </Link>
        </div>
      </article>
    );
  }

  return (
    <Link
      href={linkHref}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-border transition-shadow hover:shadow-md',
        outOfStock && 'opacity-75',
        className,
      )}
    >
      <div className="aspect-square bg-muted">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <span className="text-xs">No image</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-sm font-medium leading-snug group-hover:text-primary">{name}</h3>
        {outOfStock ? (
          <p className="text-xs font-medium text-destructive">{outOfStockLabel}</p>
        ) : (
          <p className="text-sm text-muted-foreground">From {formatPrice(priceFrom)}</p>
        )}
      </div>
    </Link>
  );
}
