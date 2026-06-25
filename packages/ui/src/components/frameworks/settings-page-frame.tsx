import { type ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { PageHeader } from '../page-header';

export interface SettingsPageFrameProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/** FW-SETTINGS — PageHeader + stacked setting card sections. */
export function SettingsPageFrame({
  title,
  description,
  children,
  className,
}: SettingsPageFrameProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <PageHeader title={title} description={description} />
      <div className="space-y-6">{children}</div>
    </div>
  );
}
