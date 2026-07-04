'use client';

import { useTranslations } from 'next-intl';
import { userInitials } from '@meridian/shared';
import type { MerchantSession } from '@meridian/shared';

import { Avatar, AvatarFallback, Badge } from '@meridian/ui';

interface MerchantOwnerProfileHeroProps {
  session: MerchantSession;
}

export function MerchantOwnerProfileHero({ session }: MerchantOwnerProfileHeroProps) {
  const t = useTranslations('merchant.settings');
  const initials = userInitials(session.displayName, session.email);
  const isOwner = session.role === 'MERCHANT_OWNER';

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border p-6 sm:flex-row sm:items-start">
      <Avatar className="size-20">
        <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <h2 className="text-lg font-semibold tracking-tight">{session.displayName}</h2>
          <Badge variant="secondary">
            {isOwner ? t('roleOwner') : t('roleStaff')}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{session.email}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t('ownerProfileHint')}</p>
      </div>
    </div>
  );
}
