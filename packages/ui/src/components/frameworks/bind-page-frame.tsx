'use client';

import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { ModeToggle } from '../theme/mode-toggle';
import { Card, CardContent } from '../ui/card';

export interface BindPageFrameProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** FW-BIND — centered status card on muted canvas; 44px touch targets for CTAs. */
export function BindPageFrame({
  title,
  description,
  children,
  footer,
  className,
}: BindPageFrameProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10',
        className,
      )}
    >
      <div className="absolute right-4 top-4 z-50">
        <ModeToggle />
      </div>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <Card>
          <CardContent className="space-y-6 pt-6">{children}</CardContent>
        </Card>
        {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}
