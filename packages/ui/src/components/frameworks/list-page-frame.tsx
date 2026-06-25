import { type ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { PageHeader } from '../page-header';
import { Skeleton } from '../ui/skeleton';

export interface ListPageFrameProps {
  title: string;
  description?: string;
  action?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  emptyState?: ReactNode;
  isLoading?: boolean;
  className?: string;
}

/** FW-LIST — PageHeader + optional filters + table slot with loading/empty states. */
export function ListPageFrame({
  title,
  description,
  action,
  filters,
  children,
  emptyState,
  isLoading,
  className,
}: ListPageFrameProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <PageHeader title={title} description={description} action={action} />
      {filters ? <div className="flex flex-wrap items-center gap-3">{filters}</div> : null}
      {isLoading ? (
        <div className="space-y-3 rounded-md border p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : emptyState ? (
        emptyState
      ) : (
        children
      )}
    </div>
  );
}
