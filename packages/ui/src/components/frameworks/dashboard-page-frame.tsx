import { type ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { PageHeader } from '../page-header';

export interface DashboardPageFrameProps {
  title: string;
  description?: string;
  action?: ReactNode;
  alert?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** FW-DASHBOARD — PageHeader + metric grid and sections (dashboard-01 pattern). */
export function DashboardPageFrame({
  title,
  description,
  action,
  alert,
  children,
  className,
}: DashboardPageFrameProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <PageHeader title={title} description={description} action={action} />
      {alert}
      {children}
    </div>
  );
}
