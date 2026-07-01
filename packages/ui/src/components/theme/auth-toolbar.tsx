'use client';

/**
 * AuthToolbar - 认证页工具栏组件
 *
 * 固定在页面右上角，包含：
 * - 语言切换下拉菜单
 * - 主题切换按钮
 *
 * 用于登录/注册/认证相关页面，提供主题和语言切换功能。
 *
 * @example
 * ```tsx
 * <AuthToolbar portal="admin" />
 * <AuthToolbar portal="merchant" />
 * ```
 */

import type { PortalId } from '@meridian/shared';

import { LocaleToggle } from './locale-toggle';
import { ModeToggle } from './mode-toggle';

/**
 * AuthToolbar 属性接口
 * @param portal - 门户标识（决定语言切换的 cookie 名称）
 */
export function AuthToolbar({ portal }: { portal: PortalId }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
      <LocaleToggle portal={portal} />
      <ModeToggle />
    </div>
  );
}
