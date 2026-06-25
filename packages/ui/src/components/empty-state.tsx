import { type ReactNode } from 'react';

import { cn } from '../lib/utils';

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
 * 列表/表格无数据时的空状态，符合无障碍与表单反馈规范。
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
