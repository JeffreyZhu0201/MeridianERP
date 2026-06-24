import { type ReactNode } from 'react';

import { cn } from '../lib/utils';

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
 * 数据密集型后台页面的统一页头：标题层级、间距与操作区对齐。
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
