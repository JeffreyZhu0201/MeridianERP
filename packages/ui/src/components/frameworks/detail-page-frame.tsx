import { type ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { PageHeader } from '../page-header';
import { Skeleton } from '../ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

export interface DetailPageFrameProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  badges?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** FW-DETAIL — breadcrumb/back + PageHeader with badges/actions + card sections. */
export function DetailPageFrame({
  title,
  description,
  backHref,
  backLabel = 'Back',
  badges,
  actions,
  children,
  className,
}: DetailPageFrameProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {backHref ? (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={backHref}>{backLabel}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}
      <PageHeader
        title={title}
        description={description}
        action={
          badges || actions ? (
            <div className="flex flex-wrap items-center gap-2">
              {badges}
              {actions}
            </div>
          ) : undefined
        }
      />
      <div className="space-y-4">{children}</div>
    </div>
  );
}
