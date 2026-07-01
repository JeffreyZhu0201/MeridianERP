/**
 * SettingsPageFrame - 设置页框架组件
 *
 * 用于系统设置页面（如账户设置、通知设置），提供：
 * - 页面标题和描述
 * - 垂直堆叠的设置卡片区块
 *
 * @example
 * ```tsx
 * <SettingsPageFrame title="通知设置" description="管理您的通知偏好">
 *   <SettingsCard title="邮件通知">
 *     <Toggle label="订单状态变更" />
 *     <Toggle label="库存预警" />
 *   </SettingsCard>
 *   <SettingsCard title="短信通知">
 *     <Toggle label="提现到账" />
 *   </SettingsCard>
 * </SettingsPageFrame>
 * ```
 */

import { type ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { PageHeader } from '../page-header';

/**
 * SettingsPageFrame 属性接口
 * @param title - 设置页标题
 * @param description - 设置页描述
 * @param children - 设置卡片内容（垂直堆叠排列）
 * @param className - 自定义样式类名
 */
export interface SettingsPageFrameProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * FW-SETTINGS - 设置页框架
 * PageHeader + 垂直堆叠的设置卡片区块
 */
export function SettingsPageFrame({
  title,
  description,
  children,
  className,
}: SettingsPageFrameProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <PageHeader title={title} description={description} />
      <div className="space-y-6">{children}</div>
    </div>
  );
}
