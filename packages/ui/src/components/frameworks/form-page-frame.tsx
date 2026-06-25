import { type ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { PageHeader } from '../page-header';
import { Card, CardContent } from '../ui/card';

export interface FormPageFrameProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** FW-FORM — PageHeader + Card-wrapped form + action footer. */
export function FormPageFrame({
  title,
  description,
  children,
  footer,
  className,
}: FormPageFrameProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
      {footer ? <div className="flex items-center justify-end gap-2">{footer}</div> : null}
    </div>
  );
}
