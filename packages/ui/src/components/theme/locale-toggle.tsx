'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { IconLanguage } from '@tabler/icons-react';
import {
  type AppLocale,
  localeCookieName,
  type PortalId,
} from '@meridian/shared';
import { useTranslations } from 'next-intl';

import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export interface LocaleToggleProps {
  portal: PortalId;
  className?: string;
}

export function LocaleToggle({ portal, className }: LocaleToggleProps) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const t = useTranslations('common.locale');

  function setLocale(next: AppLocale) {
    document.cookie = `${localeCookieName(portal)}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className={cn(className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="icon" aria-label={t('label')}>
              <IconLanguage className="size-[1.2rem]" stroke={1.5} />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setLocale('en')} disabled={locale === 'en'}>
            {t('en')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLocale('zh-CN')} disabled={locale === 'zh-CN'}>
            {t('zhCN')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
