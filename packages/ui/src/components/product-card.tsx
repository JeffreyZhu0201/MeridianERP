import Link from 'next/link';
import { cn } from '../lib/utils';

export interface ProductCardProps {
  name: string;
  slug: string;
  storeSlug: string;
  priceFrom: string | number;
  imageUrl?: string;
  className?: string;
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
}: ProductCardProps) {
  const href = `/s/${storeSlug}/products/${slug}`;

  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md',
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
        <p className="text-sm text-muted-foreground">From {formatPrice(priceFrom)}</p>
      </div>
    </Link>
  );
}
