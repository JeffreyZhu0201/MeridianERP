'use client';

/**
 * AuthLayout - 认证页面布局组件
 *
 * 用于登录/注册等认证相关页面：
 * - 全屏灰色背景（bg-muted）
 * - 居中显示品牌标识和表单卡片
 * - 右上角可选主题切换按钮
 * - MeridianERP 品牌标识
 *
 * @example
 * ```tsx
 * <AuthLayout subtitle="平台管理员" footer={<Link href="/help">需要帮助？</Link>}>
 *   <LoginForm />
 * </AuthLayout>
 * ```
 */

import type { ReactNode } from 'react';

import { cn } from '../lib/utils';
import { ModeToggle } from './theme/mode-toggle';
import { Card, CardContent } from './ui/card';

/**
 * AuthLayout 属性接口
 * @param subtitle - 门户标签（如"平台管理员"、"商户门户"）
 * @param children - 表单内容（登录/注册表单）
 * @param footer - 底部链接文本（如"需要帮助？"）
 * @param className - 自定义样式类名
 * @param showThemeToggle - 是否显示右上角主题切换按钮（默认 true）
 */
export interface AuthLayoutProps {
  /** 门户标签，如 "Platform Admin" */
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** FW-AUTH - login-03 模式：右上角固定主题切换 */
  showThemeToggle?: boolean;
}

/**
 * 认证页面布局
 * - shadcn login-03 模式：全屏灰色画布 + 居中品牌标识 + 紧凑表单卡片
 */
export function AuthLayout({
  subtitle,
  children,
  footer,
  className,
  showThemeToggle = true,
}: AuthLayoutProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10',
        className,
      )}
    >
      {/* 右上角主题切换 */}
      {showThemeToggle ? (
        <div className="absolute right-4 top-4 z-50">
          <ModeToggle />
        </div>
      ) : null}

      {/* 居中内容卡片 */}
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* 品牌标识 */}
        <div className="flex flex-col items-center gap-2 self-center text-center">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold">M</span>
          </div>
          <div>
            <p className="font-semibold tracking-tight">MeridianERP</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* 表单卡片 — 认证页使用中性灰边框，便于与背景区分 */}
        <Card className="border border-neutral-300 ring-0 shadow-none dark:border-neutral-700">
          <CardContent className="pt-6 [&_input]:border-neutral-300 dark:[&_input]:border-neutral-600">
            {children}
          </CardContent>
        </Card>

        {/* 底部链接 */}
        {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}
