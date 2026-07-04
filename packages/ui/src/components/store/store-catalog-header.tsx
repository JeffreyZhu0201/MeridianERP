import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface StoreCatalogMetric {
  title: string;
  value: ReactNode;
  accent?: boolean;
}

export interface StoreCatalogHeaderProps {
  title: string;
  description?: string;
  metrics?: StoreCatalogMetric[];
  className?: string;
}

/**
 * Store catalog page header — 8+4 layout from stich.md Unified Catalog.
 */
export function StoreCatalogHeader({
  title,
  description,
  metrics = [],
  className,
}: StoreCatalogHeaderProps) {
  return (
    <div className={cn('mb-8 grid grid-cols-1 gap-6 md:grid-cols-12', className)}>
      <div className="flex flex-col justify-center md:col-span-8">
        <h1 className="store-headline-xl text-foreground">{title}</h1>
        {description ? (
          <p className="store-body-md mt-2 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {metrics.length > 0 ? (
        <div className="flex gap-4 md:col-span-4">
          {metrics.map((metric) => (
            <div
              key={metric.title}
              className={cn(
                'store-bento-card flex flex-1 flex-col justify-center p-4',
                metric.accent && 'store-metric-accent border-transparent',
              )}
            >
              <span
                className={cn(
                  'store-label mb-1',
                  metric.accent ? 'opacity-80' : 'text-muted-foreground',
                )}
              >
                {metric.title}
              </span>
              <span className="store-headline-lg tabular-nums">{metric.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
