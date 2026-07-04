'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { IconLock, IconLayoutGrid } from '@tabler/icons-react';
import { cn } from '../../lib/utils';

export interface StoreCheckoutShellProps {
  children: ReactNode;
  homeHref?: string;
  brandLabel?: string;
  secureLabel?: string;
  className?: string;
}

/**
 * Minimal checkout shell — logo + secure badge, no shop nav (stich.md).
 */
export function StoreCheckoutShell({
  children,
  homeHref = '/shop',
  brandLabel = 'Meridian Store',
  secureLabel = 'Secure Checkout',
  className,
}: StoreCheckoutShellProps) {
  return (
    <div className={cn('flex min-h-dvh flex-col bg-background', className)}>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-12">
          <Link
            href={homeHref}
            className="store-headline-lg flex items-center gap-2 text-primary hover:opacity-90"
          >
            <IconLayoutGrid className="size-6 shrink-0" stroke={1.75} />
            {brandLabel}
          </Link>
          <div className="store-label flex items-center gap-2 text-primary">
            <IconLock className="size-5 shrink-0" stroke={1.5} />
            <span className="hidden sm:inline">{secureLabel}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-12 md:py-12">
        {children}
      </main>
    </div>
  );
}
