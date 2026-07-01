/**
 * PageHeader - 统一页面标题组件
 *
 * 用于数据密集型后台页面的统一页头：
 * - 页面主标题（H1，text-2xl）
 * - 可选描述文案（text-sm 灰色）
 * - 右侧操作区（主按钮、链接等）
 * - 响应式布局：移动端垂直堆叠，桌面端水平排列
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="订单管理"
 *   description="查看和管理所有订单"
 *   action={<Button>新建订单</Button>}
 * />
 * ```
 */

import { type ReactNode } from 'react';

import { cn } from '../lib/utils';

/**
 * PageHeader 属性接口
 * @param title - 页面主标题（H1）
 * @param description - 可选副标题或说明文案
 * @param action - 右侧操作区（主按钮、链接等）
 * @param className - 自定义样式类名
 */
export interface PageHeaderProps {
  /** 页面主标题 */
  title: string;
  /** 可选副标题或说明文案 */
  description?: string;
  /** 右侧操作区（主按钮、链接等） */
  action?: ReactNode;
  className?: string;
}

/**
 * 统一页面标题组件
 * - 响应式布局：移动端垂直堆叠，桌面端水平排列
 * - 标题与描述使用 min-w-0 防止文本溢出
 */
export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}
