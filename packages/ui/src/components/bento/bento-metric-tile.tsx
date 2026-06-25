import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { BentoTile } from './bento-tile';

export interface BentoMetricTileProps {
  title: string;
  value: ReactNode;
  description?: string;
  colSpan?: 1 | 2;
  className?: string;
}

export function BentoMetricTile({
  title,
  value,
  description,
  colSpan = 1,
  className,
}: BentoMetricTileProps) {
  return (
    <BentoTile colSpan={colSpan} className={className}>
      <div className="flex h-full flex-col justify-center p-4">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </BentoTile>
  );
}

export interface BentoListHeaderProps {
  metrics: Array<{ title: string; value: ReactNode; description?: string }>;
  className?: string;
}

/** Compact metric strip above list tables (archetype B). */
export function BentoListHeader({ metrics, className }: BentoListHeaderProps) {
  if (metrics.length === 0) return null;
  const columns = Math.min(4, Math.max(2, metrics.length)) as 2 | 3 | 4;
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', columns >= 3 && 'lg:grid-cols-3', columns === 4 && 'xl:grid-cols-4', className)}>
      {metrics.map((metric) => (
        <BentoMetricTile key={metric.title} title={metric.title} value={metric.value} description={metric.description} />
      ))}
    </div>
  );
}

export interface BentoDetailHeroProps {
  metrics: Array<{ title: string; value: ReactNode }>;
  actions?: ReactNode;
  className?: string;
}

/** Summary tiles above detail sections (archetype C). */
export function BentoDetailHero({ metrics, actions, className }: BentoDetailHeroProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <BentoMetricTile key={metric.title} title={metric.title} value={metric.value} />
        ))}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
