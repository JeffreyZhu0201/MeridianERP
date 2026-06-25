import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

const colSpanClass: Record<1 | 2 | 3 | 4, string> = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
};

const rowSpanClass: Record<1 | 2 | 3, string> = {
  1: 'md:row-span-1',
  2: 'md:row-span-2',
  3: 'md:row-span-3',
};

export interface BentoTileProps {
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2 | 3;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

export function BentoTile({
  colSpan = 1,
  rowSpan = 1,
  children,
  className,
  'aria-label': ariaLabel,
}: BentoTileProps) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        'rounded-xl bg-card text-card-foreground ring-1 ring-border',
        colSpanClass[colSpan],
        rowSpanClass[rowSpan],
        className,
      )}
    >
      {children}
    </div>
  );
}
