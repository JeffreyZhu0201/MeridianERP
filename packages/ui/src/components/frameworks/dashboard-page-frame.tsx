/**
 * DashboardPageFrame - 仪表盘页框架组件
 *
 * 用于系统仪表盘/首页（如管理员首页、商户首页），提供：
 * - 页面标题、描述和操作按钮
 * - 可选的警告/提示区域
 * - Bento 网格布局的内容区
 *
 * @example
 * ```tsx
 * <DashboardPageFrame
 *   title="控制台"
 *   description="系统运行概览"
 *   action={<Button>刷新</Button>}
 *   alert={<Alert type="warning" message="库存不足" />}
 * >
 *   <BentoGrid>
 *     <BentoMetricTile title="今日订单" value={128} />
 *     <BentoMetricTile title="销售额" value="¥12,580" />
 *   </BentoGrid>
 * </DashboardPageFrame>
 * ```
 */

import { type ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { PageHeader } from '../page-header';

/**
 * DashboardPageFrame 属性接口
 * @param title - 仪表盘标题
 * @param description - 仪表盘描述
 * @param action - 右侧操作按钮
 * @param alert - 警告/提示区域（如系统公告、紧急通知）
 * @param children - 仪表盘内容（通常为 BentoGrid + 各类 BentoTile）
 * @param className - 自定义样式类名
 */
export interface DashboardPageFrameProps {
  title: string;
  description?: string;
  action?: ReactNode;
  alert?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * FW-DASHBOARD - 仪表盘页框架
 * PageHeader + 警告提示区 + Bento 网格布局内容（dashboard-01 模式）
 */
export function DashboardPageFrame({
  title,
  description,
  action,
  alert,
  children,
  className,
}: DashboardPageFrameProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <PageHeader title={title} description={description} action={action} />
      {alert}
      {children}
    </div>
  );
}
