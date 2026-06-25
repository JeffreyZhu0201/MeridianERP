import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

const columnClass: Record<2 | 3 | 4, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
};

export interface BentoGridProps {
  columns?: 2 | 3 | 4;
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ columns = 4, children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid auto-rows-min grid-cols-1 gap-4',
        columnClass[columns],
        className,
      )}
    >
      {children}
    </div>
  );
}
