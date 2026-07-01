'use client';

/**
 * LocaleToggle - 语言切换下拉菜单组件
 *
 * 提供中/英文切换功能：
 * - 点击语言图标打开下拉菜单
 * - 支持切换到 English、简体中文
 * - 切换后设置对应门户的 cookie 并刷新页面
 * - 当前语言项禁用显示
 *
 * @example
 * ```tsx
 * <LocaleToggle portal="admin" />
 * <LocaleToggle portal="merchant" />
 * <LocaleToggle portal="store" />
 * ```
 */

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

/**
 * LocaleToggle 属性接口
 * @param portal - 门户标识（决定 cookie 名称：admin/merchant/store/distributor）
 * @param className - 自定义样式类名
 */
export interface LocaleToggleProps {
  portal: PortalId;
  className?: string;
}

/**
 * 语言切换下拉菜单
 * - 触发器显示语言图标
 * - 下拉菜单包含 English、简体中文
 * - 当前语言项显示为禁用状态
 */
export function LocaleToggle({ portal, className }: LocaleToggleProps) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const t = useTranslations('common.locale');

  /** 设置语言并刷新页面 */
  function setLocale(next: AppLocale) {
    document.cookie = `${localeCookieName(portal)}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className={cn(className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" aria-label={t('label')}>
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
