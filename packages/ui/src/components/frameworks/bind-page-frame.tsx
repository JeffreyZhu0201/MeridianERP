'use client';

/**
 * BindPageFrame - 绑定页框架组件
 *
 * 用于经销商-商户绑定、门店绑定等场景，提供：
 * - 居中显示的半屏背景（bg-muted）
 * - 状态卡片（标题、描述、表单内容）
 * - 右上角主题切换按钮
 * - 触控友好的 44px 最小点击目标
 *
 * @example
 * ```tsx
 * <BindPageFrame
 *   title="绑定门店"
 *   description="输入经销商提供的绑定码来关联您的门店"
 *   footer={<Link href="/help">需要帮助？</Link>}
 * >
 *   <BindCodeInput />
 *   <Button>确认绑定</Button>
 * </BindPageFrame>
 * ```
 */

import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { ModeToggle } from '../theme/mode-toggle';
import { Card, CardContent } from '../ui/card';

/**
 * BindPageFrame 属性接口
 * @param title - 绑定页标题
 * @param description - 绑定页描述
 * @param children - 表单内容
 * @param footer - 底部链接文本
 * @param className - 自定义样式类名
 */
export interface BindPageFrameProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * FW-BIND - 绑定页框架
 * 居中状态卡片（半屏灰色背景）+ 右上角主题切换
 * CTA 按钮保证 44px 最小触控目标
 */
export function BindPageFrame({
  title,
  description,
  children,
  footer,
  className,
}: BindPageFrameProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10',
        className,
      )}
    >
      {/* 右上角主题切换 */}
      <div className="absolute right-4 top-4 z-50">
        <ModeToggle />
      </div>

      {/* 居中内容卡片 */}
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <Card>
          <CardContent className="space-y-6 pt-6">{children}</CardContent>
        </Card>
        {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}
