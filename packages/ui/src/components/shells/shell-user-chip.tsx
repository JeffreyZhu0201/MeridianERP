'use client';

import Link from 'next/link';
import { userInitials } from '@meridian/shared';

import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '../../lib/utils';

export interface ShellUserChipProps {
  displayName?: string;
  email?: string;
  loading?: boolean;
  href?: string;
  ariaLabel?: string;
}

function ChipContent({
  displayName,
  email,
}: {
  displayName?: string;
  email?: string;
}) {
  const name = displayName ?? email ?? '';
  const initials = userInitials(name, email ?? name);

  return (
    <>
      <Avatar className="size-8">
        <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
      </Avatar>
      <div className="hidden min-w-0 flex-col sm:flex">
        <span className="truncate text-sm font-medium leading-none">{name}</span>
        {email && displayName ? (
          <span className="truncate text-xs text-muted-foreground">{email}</span>
        ) : null}
      </div>
    </>
  );
}

export function ShellUserChip({
  displayName,
  email,
  loading = false,
  href,
  ariaLabel,
}: ShellUserChipProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">…</AvatarFallback>
        </Avatar>
        <div className="hidden h-8 w-24 animate-pulse rounded-md bg-muted sm:block" />
      </div>
    );
  }

  if (!displayName && !email) {
    return null;
  }

  const className = cn(
    'flex items-center gap-2 rounded-lg px-1 py-0.5 transition-colors',
    href && 'cursor-pointer hover:bg-muted',
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-label={ariaLabel}>
        <ChipContent displayName={displayName} email={email} />
      </Link>
    );
  }

  return (
    <div className={className}>
      <ChipContent displayName={displayName} email={email} />
    </div>
  );
}
