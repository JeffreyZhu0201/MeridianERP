import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { PageHeader } from '../page-header';
import { BentoGrid } from './bento-grid';

export interface BentoDashboardFrameProps {
  title: string;
  description?: string;
  action?: ReactNode;
  alert?: ReactNode;
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function BentoDashboardFrame({
  title,
  description,
  action,
  alert,
  children,
  columns = 4,
  className,
}: BentoDashboardFrameProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <PageHeader title={title} description={description} action={action} />
      {alert}
      <BentoGrid columns={columns}>{children}</BentoGrid>
    </div>
  );
}
