'use client';

/**
 * ShellFrame - 旧版通用 Shell 框架组件（已废弃）
 *
 * @deprecated 请使用 ErpShell 替代
 *
 * 提供可折叠侧边栏 + 主内容区布局，适用于旧版后台管理界面。
 * 在移动端侧边栏以抽屉（Sheet）形式展示。
 *
 * @example
 * ```tsx
 * // 已废弃，请使用：
 * <ErpShell sidebar={<Nav />} portal="admin">
 *   {children}
 * </ErpShell>
 * ```
 */

import { type ReactNode, useState } from 'react';

import { cn } from '../../lib/utils';
import { Sheet } from '../ui/sheet';

/**
 * ShellFrame 属性接口
 * @param sidebar - 侧边栏导航内容
 * @param header - 顶部工具栏内容（可选）
 * @param children - 页面主内容
 * @param className - 自定义样式类名
 */
export interface ShellFrameProps {
  sidebar: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * @deprecated Use ErpShell from `@meridian/ui` instead.
 * 旧版 Shell 框架：可折叠侧边栏 + 主内容区顶部导航栏布局
 */
export function ShellFrame({ sidebar, header, children, className }: ShellFrameProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={cn('flex min-h-svh w-full', className)}>
      {/* 桌面端侧边栏 - 大屏下永久显示 */}
      <aside className="hidden w-64 shrink-0 border-r border-border/50 bg-muted/30 md:block">{sidebar}</aside>

      {/* 移动端侧边栏 - 通过 Sheet 抽屉展示 */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen} title="Navigation">
        <div className="p-3">{sidebar}</div>
      </Sheet>

      {/* 主内容区 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/50 px-4">
          {/* 移动端菜单按钮 */}
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
