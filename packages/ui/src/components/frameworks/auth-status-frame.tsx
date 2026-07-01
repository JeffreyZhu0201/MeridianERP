'use client';

/**
 * AuthStatusFrame - 认证状态页框架组件
 *
 * 用于认证相关状态展示页面（如入驻引导、登录提示），提供：
 * - AuthLayout 布局（居中的状态卡片）
 * - MeridianERP 品牌标识
 * - 状态标题、描述和内容区
 *
 * @example
 * ```tsx
 * <AuthStatusFrame
 *   subtitle="平台管理员"
 *   title="入驻申请已提交"
 *   description="我们将在 1-2 个工作日内审核您的申请"
 * >
 *   <CheckCircleIcon />
 * </AuthStatusFrame>
 * ```
 */

import type { ReactNode } from 'react';

import { AuthLayout } from '../auth-layout';

/**
 * AuthStatusFrame 属性接口
 * @param subtitle - 门户标签（如"平台管理员"、"商户门户"）
 * @param title - 状态标题（如"入驻申请已提交"）
 * @param description - 状态描述
 * @param children - 状态图标或额外内容
 * @param footer - 底部链接（如"返回登录"）
 */
export interface AuthStatusFrameProps {
  /** MeridianERP 品牌下的门户标签 */
  subtitle: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}

/**
 * FW-AUTH-STATUS - 认证状态页框架
 * login-03 画布 + 居中状态卡片（用于入驻引导、登录提示等）
 */
export function AuthStatusFrame({
  subtitle,
  title,
  description,
  children,
  footer,
}: AuthStatusFrameProps) {
  return (
    <AuthLayout subtitle={subtitle} footer={footer}>
      <div className="space-y-4 text-center">
        {children}
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
    </AuthLayout>
  );
}
