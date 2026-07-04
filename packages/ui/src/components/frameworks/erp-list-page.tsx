import type { ReactNode } from 'react';

import { BentoListHeader, type BentoListHeaderProps } from '../bento';
import { ListPageFrame } from './list-page-frame';

export interface ErpListPageProps {
  metrics: BentoListHeaderProps['metrics'];
  title: string;
  description?: string;
  action?: ReactNode;
  filters?: ReactNode;
  emptyState?: ReactNode;
  isLoading?: boolean;
  children: ReactNode;
}

/**
 * Standard ERP list page: BentoListHeader + ListPageFrame (admin, merchant, distributor).
 */
export function ErpListPage({
  metrics,
  title,
  description,
  action,
  filters,
  emptyState,
  isLoading,
  children,
}: ErpListPageProps) {
  return (
    <div className="space-y-6">
      <BentoListHeader metrics={metrics} />
      <ListPageFrame
        title={title}
        description={description}
        action={action}
        filters={filters}
        emptyState={emptyState}
        isLoading={isLoading}
      >
        {children}
      </ListPageFrame>
    </div>
  );
}
