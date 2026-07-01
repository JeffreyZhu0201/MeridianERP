/**
 * BentoDashboardFrame - Bento 仪表盘框架组件
 *
 * 用于 Bento 网格化仪表盘页面，结合 PageHeader 和 BentoGrid：
 * - 页面标题、描述和操作按钮
 * - 可选的警告/提示区域
 * - Bento 网格布局的仪表盘内容
 *
 * @example
 * ```tsx
 * <BentoDashboardFrame
 *   title="控制台"
 *   description="商户运营概览"
 *   action={<Button>刷新</Button>}
 *   alert={<Alert type="warning">库存不足</Alert>}
 *   columns={4}
 * >
 *   <BentoMetricTile title="今日订单" value={128} />
 *   <BentoMetricTile title="销售额" value="¥12,580" />
 *   <BentoChartTile title="趋势" data={data} series={series} />
 * </BentoDashboardFrame>
 * ```
 */

import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { PageHeader } from '../page-header';
import { BentoGrid } from './bento-grid';

/**
 * BentoDashboardFrame 属性接口
 * @param title - 仪表盘标题
 * @param description - 仪表盘描述
 * @param action - 右侧操作按钮
 * @param alert - 警告/提示区域
 * @param children - Bento 瓦片内容
 * @param columns - 网格列数（默认 4）
 * @param className - 自定义样式类名
 */
export interface BentoDashboardFrameProps {
  title: string;
  description?: string;
  action?: ReactNode;
  alert?: ReactNode;
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * Bento 仪表盘框架
 * PageHeader + 警告提示区 + BentoGrid 网格布局
 */
export function BentoDashboardFrame({
  title,
  description,
  action,
  alert,
  children,
  columns = 4,
  className,
}: BentoDashboardFrameProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <PageHeader title={title} description={description} action={action} />
      {alert}
      <BentoGrid columns={columns}>{children}</BentoGrid>
    </div>
  );
}
