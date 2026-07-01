/**
 * EmptyState - 空状态占位组件
 *
 * 用于列表/表格无数据时展示：
 * - 主文案标题（如"暂无订单"）
 * - 引导说明（如"创建您的第一个订单"）
 * - 可选操作按钮（如"新建"）
 * - 可选装饰图标
 * - 符合无障碍规范（role="status"）
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="暂无订单"
 *   description="开始添加您的第一个订单"
 *   action={<Button>新建订单</Button>}
 *   icon={<PackageIcon />}
 * />
 * ```
 */

import { type ReactNode } from 'react';

import { cn } from '../lib/utils';

/**
 * EmptyState 属性接口
 * @param title - 空状态主文案
 * @param description - 引导用户下一步操作的说明
 * @param action - 主操作按钮（如「新建仓库」）
 * @param icon - 可选装饰图标（Lucide 等矢量图标）
 * @param className - 自定义样式类名
 */
export interface EmptyStateProps {
  /** 空状态主文案 */
  title: string;
  /** 引导用户下一步操作的说明 */
  description?: string;
  /** 主操作（如「新建仓库」） */
  action?: ReactNode;
  /** 可选装饰图标（Lucide 等矢量图标） */
  icon?: ReactNode;
  className?: string;
}

/**
 * 空状态组件
 * - 虚线边框圆角容器
 * - 图标、主文案、描述、操作按钮垂直居中排列
 * - role="status" 符合无障碍规范
 */
export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border/40 bg-muted/30 px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 text-muted-foreground" aria-hidden>
          {icon}
        </div>
      ) : null}
      <p className="text-base font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
