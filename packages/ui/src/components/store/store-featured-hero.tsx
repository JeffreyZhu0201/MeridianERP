import Link from 'next/link';
import { cn } from '../../lib/utils';

export interface StoreFeaturedHeroProps {
  badge?: string;
  title: string;
  description?: string;
  price?: string;
  href: string;
  ctaLabel?: string;
  className?: string;
}

/**
 * Featured product hero with glass overlay — stich.md catalog hero pattern.
 */
export function StoreFeaturedHero({
  badge,
  title,
  description,
  price,
  href,
  ctaLabel = 'View product',
  className,
}: StoreFeaturedHeroProps) {
  return (
    <div
      className={cn(
        'store-bento-card relative mb-8 flex min-h-[280px] items-end overflow-hidden bg-muted md:min-h-[360px]',
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-muted to-accent/40" />
      <div className="relative m-4 w-full rounded-xl store-glass p-6 md:flex md:items-end md:justify-between md:gap-6">
        <div className="max-w-xl space-y-2">
          {badge ? (
            <span className="inline-block rounded-full bg-secondary/15 px-3 py-1 text-xs font-medium tracking-wide text-secondary">
              {badge}
            </span>
          ) : null}
          <h2 className="store-headline-lg text-foreground">{title}</h2>
          {description ? (
            <p className="store-body-md text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="mt-4 flex flex-col items-start gap-3 md:mt-0 md:items-end">
          {price ? <span className="store-price">{price}</span> : null}
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
