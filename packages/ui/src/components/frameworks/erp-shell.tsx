'use client';

/**
 * ErpShell - 通用 ERP 布局框架（推荐使用）
 *
 * 基于 shadcn/ui Sidebar 组件的现代化 ERP 布局，提供：
 * - 可折叠侧边栏（桌面端可折叠为图标，移动端自动收起）
 * - 顶部导航栏（包含触发器、起始内容、结束内容）
 * - 暗色模式与国际化切换（自动集成到工具栏右侧）
 *
 * 这是 AdminShell、MerchantShell 等组件的底层实现基础。
 *
 * @example
 * ```tsx
 * <ErpShell
 *   portal="admin"
 *   sidebarHeader={<BrandLogo />}
 *   sidebar={<MainNav />}
 *   headerEnd={<UserMenu />}
 * >
 *   <PageContent />
 * </ErpShell>
 * ```
 */

import { type ReactNode } from 'react';
import type { PortalId } from '@meridian/shared';

import { cn } from '../../lib/utils';
import { LocaleToggle } from '../theme/locale-toggle';
import { ModeToggle } from '../theme/mode-toggle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '../ui/sidebar';

/**
 * ErpShell 属性接口
 * @param sidebarHeader - 侧边栏顶部内容（如品牌 Logo、商户名称）
 * @param sidebar - 侧边栏导航内容（通常为 SidebarGroup + SidebarMenu）
 * @param sidebarFooter - 侧边栏底部内容（可选）
 * @param headerStart - 顶部栏左侧内容（位于 SidebarTrigger 之后）
 * @param headerEnd - 顶部栏右侧内容（位于语言/主题切换之前）
 * @param portal - 门户标识（用于语言切换 cookie：admin/merchant/store/distributor）
 * @param children - 页面主内容
 * @param className - 自定义样式类名
 */
export interface ErpShellProps {
  /** 侧边栏顶部插槽 - 品牌 Logo / 商户名称 */
  sidebarHeader?: ReactNode;
  /** 侧边栏导航内容 */
  sidebar: ReactNode;
  /** 侧边栏底部内容（可选） */
  sidebarFooter?: ReactNode;
  /** 顶部栏左侧内容（SidebarTrigger 之后） */
  headerStart?: ReactNode;
  /** 顶部栏右侧集群（语言/主题切换之前） */
  headerEnd?: ReactNode;
  /** 门户标识（用于语言切换） */
  portal: PortalId;
  /** 页面主内容 */
  children: ReactNode;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * FW-SHELL-ERP - 现代化 ERP 布局
 * 结合 dashboard-01 仪表盘布局与 sidebar-03 侧边栏样式，
 * 在顶部工具栏集成主题切换按钮。
 */
export function ErpShell({
  sidebarHeader,
  sidebar,
  sidebarFooter,
  headerStart,
  headerEnd,
  portal,
  children,
  className,
}: ErpShellProps) {
  return (
    <SidebarProvider>
      {/* 可折叠侧边栏 */}
      <Sidebar collapsible="icon" variant="sidebar">
        {sidebarHeader ? <SidebarHeader>{sidebarHeader}</SidebarHeader> : null}
        <SidebarContent>{sidebar}</SidebarContent>
        {sidebarFooter ? <SidebarFooter>{sidebarFooter}</SidebarFooter> : null}
      </Sidebar>

      {/* 主内容区 */}
      <SidebarInset className={className}>
        {/* 顶部导航栏 */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 px-4">
          <SidebarTrigger />
          {headerStart}
          <div className="ml-auto flex items-center gap-2">
            {headerEnd}
            <LocaleToggle portal={portal} />
            <ModeToggle />
          </div>
        </header>

        {/* 页面内容 */}
        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 md:gap-6 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
