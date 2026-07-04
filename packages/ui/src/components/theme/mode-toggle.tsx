'use client';

/**
 * ModeToggle - 主题切换下拉菜单组件
 *
 * 提供明/暗/系统主题切换功能：
 * - 点击太阳图标打开下拉菜单
 * - 支持切换到 Light、Dark、System 三种模式
 * - 使用 next-themes 的 useTheme hook 管理主题
 * - 图标根据当前主题动态变化
 *
 * @example
 * ```tsx
 * <ModeToggle />
 * // 或带自定义样式
 * <ModeToggle className="ml-auto" />
 * ```
 */

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { cn } from '../../lib/utils';
import { buttonVariants } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

/**
 * ModeToggle 属性接口
 * @param className - 自定义样式类名
 */
export interface ModeToggleProps {
  className?: string;
}

/**
 * 主题切换下拉菜单
 * - 触发器显示太阳/月亮图标（根据当前主题）
 * - 下拉菜单包含 Light、Dark、System 三个选项
 */
export function ModeToggle({ className }: ModeToggleProps) {
  const { setTheme } = useTheme();
  const t = useTranslations('common.theme');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const triggerClassName = cn(
    buttonVariants({ variant: 'ghost', size: 'icon' }),
    'relative',
  );

  if (!mounted) {
    return (
      <div className={cn(className)}>
        <button type="button" className={triggerClassName} aria-label={t('toggle')} disabled>
          <Sun className="h-[1.2rem] w-[1.2rem]" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      <DropdownMenu>
        <DropdownMenuTrigger className={triggerClassName}>
          {/* 太阳图标 - 亮色模式下显示 */}
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          {/* 月亮图标 - 暗色模式下显示 */}
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('toggle')}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme('light')}>{t('light')}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>{t('dark')}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')}>{t('system')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
