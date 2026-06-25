'use client';

import type { ReactNode } from 'react';

import { cn } from '../lib/utils';
import { ModeToggle } from './theme/mode-toggle';
import { Card, CardContent } from './ui/card';

export interface AuthLayoutProps {
  /** Portal label, e.g. "Platform Admin" */
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** FW-AUTH — login-03 with fixed theme toggle (top-right). */
  showThemeToggle?: boolean;
}

/**
 * shadcn login-03 pattern: muted full-viewport canvas, centered brand, compact form card.
 */
export function AuthLayout({
  subtitle,
  children,
  footer,
  className,
  showThemeToggle = true,
}: AuthLayoutProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10',
        className,
      )}
    >
      {showThemeToggle ? (
        <div className="absolute right-4 top-4 z-50">
          <ModeToggle />
        </div>
      ) : null}
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2 self-center text-center">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold">M</span>
          </div>
          <div>
            <p className="font-semibold tracking-tight">MeridianERP</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Card className="border shadow-sm">
          <CardContent className="pt-6">{children}</CardContent>
        </Card>
        {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}
