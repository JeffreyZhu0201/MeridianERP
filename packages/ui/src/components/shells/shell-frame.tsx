'use client';

import { type ReactNode, useState } from 'react';

import { cn } from '../../lib/utils';
import { Sheet } from '../ui/sheet';

export interface ShellFrameProps {
  sidebar: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * @deprecated Use ErpShell from `@meridian/ui` instead.
 * dashboard-01 Featured skeleton: collapsible sidebar + inset main with top bar.
 */
export function ShellFrame({ sidebar, header, children, className }: ShellFrameProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={cn('flex min-h-svh w-full', className)}>
      <aside className="hidden w-64 shrink-0 border-r bg-muted/30 md:block">{sidebar}</aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen} title="Navigation">
        <div className="p-3">{sidebar}</div>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md hover:bg-muted md:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {header}
        </header>
        <main className="flex flex-1 flex-col gap-4 overflow-auto p-4 md:gap-6 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
