/**
 * MetricCard - 指标卡片组件
 *
 * 用于展示单个关键指标（KPI），如"今日订单数"、"本月销售额"。
 * 包含标题、数值和可选图标。
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="今日订单"
 *   value={128}
 *   icon={<ReceiptIcon />}
 * />
 * ```
 */

import { type ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Card, CardContent } from './ui/card';

/**
 * MetricCard 属性接口
 * @param title - 指标名称（如"今日订单"）
 * @param value - 指标数值（支持字符串或数字）
 * @param className - 自定义样式类名
 * @param icon - 可选图标（显示在标题右侧）
 */
export interface MetricCardProps {
  title: string;
  value: string | number;
  className?: string;
  icon?: ReactNode;
}

/**
 * 指标卡片组件
 * - 标题在上方（小字号灰色）
 * - 数值在下方（大字号加粗）
 * - 可选图标显示在标题右侧
 */
export function MetricCard({ title, value, className, icon }: MetricCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="p-4 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
