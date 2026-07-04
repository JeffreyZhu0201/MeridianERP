import { IconMail } from '@tabler/icons-react';
import { cn } from '../../lib/utils';

export interface StoreAccountProfileHeroProps {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  className?: string;
}

function profileInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string,
): string {
  const first = firstName?.trim().charAt(0) ?? '';
  const last = lastName?.trim().charAt(0) ?? '';
  if (first || last) return `${first}${last}`.toUpperCase();
  return (email?.charAt(0) ?? '?').toUpperCase();
}

function profileName(
  firstName?: string | null,
  lastName?: string | null,
  email?: string,
): string {
  const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return email ?? '';
}

/**
 * Account profile hero — avatar, name, email per stich.md.
 */
export function StoreAccountProfileHero({
  firstName,
  lastName,
  email,
  className,
}: StoreAccountProfileHeroProps) {
  return (
    <div
      className={cn(
        'store-bento-card flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start',
        className,
      )}
    >
      <div
        className="flex size-20 shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/10 text-xl font-semibold text-primary"
        aria-hidden
      >
        {profileInitials(firstName, lastName, email)}
      </div>
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <h1 className="store-headline-lg text-foreground">
          {profileName(firstName, lastName, email)}
        </h1>
        <p className="store-body-sm mt-1 flex items-center justify-center gap-1 text-muted-foreground sm:justify-start">
          <IconMail className="size-4 shrink-0" stroke={1.5} />
          {email}
        </p>
      </div>
    </div>
  );
}
