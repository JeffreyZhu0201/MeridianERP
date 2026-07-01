/**
 * BentoMetricTile - Bento 指标瓦片组件
 *
 * 用于展示单个关键指标（KPI），如"今日订单数"、"本月销售额"。
 * 包含标题、数值和可选描述/趋势说明。
 *
 * @example
 * ```tsx
 * <BentoMetricTile
 *   title="今日订单"
 *   value={128}
 *   description="较昨日 +12%"
 *   colSpan={1}
 * />
 * ```
 */

import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { BentoTile } from './bento-tile';

/**
 * BentoMetricTile 属性接口
 * @param title - 指标名称（如"今日订单"）
 * @param value - 指标数值（支持 ReactNode，可传入自定义格式）
 * @param description - 指标描述（如"较昨日 +12%"）
 * @param colSpan - 列跨度（1 或 2，默认 1）
 * @param className - 自定义样式类名
 */
export interface BentoMetricTileProps {
  title: string;
  value: ReactNode;
  description?: string;
  colSpan?: 1 | 2;
  className?: string;
}

/**
 * Bento 指标瓦片
 * - 垂直居中布局
 * - 标题小字号（text-xs）灰色
 * - 数值大字号（text-2xl）黑色
 * - 描述小字号灰色
 */
export function BentoMetricTile({
  title,
  value,
  description,
  colSpan = 1,
  className,
}: BentoMetricTileProps) {
  return (
    <BentoTile colSpan={colSpan} className={className}>
      <div className="flex h-full flex-col justify-center p-4">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </BentoTile>
  );
}

/**
 * BentoListHeaderProps - 列表头部指标条属性
 * @param metrics - 指标数组，每项包含 title、value、description
 * @param className - 自定义样式类名
 */
export interface BentoListHeaderProps {
  metrics: Array<{ title: string; value: ReactNode; description?: string }>;
  className?: string;
}

/**
 * BentoListHeader - 列表头部指标条（Archetype B）
 *
 * 位于列表/表格上方的紧凑指标条，适合展示汇总数据。
 * 根据指标数量自动调整列数（2-4 列）。
 *
 * @example
 * ```tsx
 * <BentoListHeader
 *   metrics={[
 *     { title: '总订单', value: 1280 },
 *     { title: '待处理', value: 23 },
 *     { title: '已完成', value: 1257 },
 *   ]}
 * />
 * ```
 */
export function BentoListHeader({ metrics, className }: BentoListHeaderProps) {
  if (metrics.length === 0) return null;
  // 根据指标数量自动选择列数（最少 2 列，最多 4 列）
  const columns = Math.min(4, Math.max(2, metrics.length)) as 2 | 3 | 4;
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', columns >= 3 && 'lg:grid-cols-3', columns === 4 && 'xl:grid-cols-4', className)}>
      {metrics.map((metric) => (
        <BentoMetricTile key={metric.title} title={metric.title} value={metric.value} description={metric.description} />
      ))}
    </div>
  );
}

/**
 * BentoDetailHeroProps - 详情页顶部指标组属性
 * @param metrics - 指标数组
 * @param actions - 操作按钮（如「编辑」「导出」）
 * @param className - 自定义样式类名
 */
export interface BentoDetailHeroProps {
  metrics: Array<{ title: string; value: ReactNode }>;
  actions?: ReactNode;
  className?: string;
}

/**
 * BentoDetailHero - 详情页顶部指标组（Archetype C）
 *
 * 位于详情页面顶部的指标汇总区，横向排列 1-3 个指标瓦片。
 * 下方可放置操作按钮。
 *
 * @example
 * ```tsx
 * <BentoDetailHero
 *   metrics={[
 *     { title: '订单总数', value: 1280 },
 *     { title: '总金额', value: '¥128,580' },
 *   ]}
 *   actions={<Button>导出</Button>}
 * />
 * ```
 */
export function BentoDetailHero({ metrics, actions, className }: BentoDetailHeroProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <BentoMetricTile key={metric.title} title={metric.title} value={metric.value} />
        ))}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
