'use client';

/**
 * BentoChartTile - Bento 图表瓦片组件
 *
 * 用于在 Bento 仪表盘中展示柱状图，基于 recharts 库实现。
 * 支持多系列数据、自定义颜色和空状态展示。
 *
 * @example
 * ```tsx
 * <BentoChartTile
 *   title="每日订单"
 *   description="近 7 天订单趋势"
 *   colSpan={2}
 *   rowSpan={2}
 *   data={orderData}
 *   series={[
 *     { key: 'orders', label: '订单数', color: 'hsl(var(--primary))' },
 *     { key: 'revenue', label: '销售额', color: 'hsl(142, 70%, 45%)' },
 *   ]}
 *   xKey="date"
 * />
 * ```
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '../../lib/utils';
import { BentoTile } from './bento-tile';
import { EmptyState } from '../empty-state';

/**
 * 图表数据系列配置
 * @param key - 数据对象中的字段名
 * @param label - 系列显示名称（用于 Tooltip）
 * @param color - 柱状图颜色（CSS 颜色值或 HSL）
 */
export interface BentoChartSeries {
  key: string;
  label: string;
  color?: string;
}

/**
 * BentoChartTile 属性接口
 * @param title - 图表标题
 * @param description - 图表描述
 * @param colSpan - 列跨度（2/3/4，默认 2）
 * @param rowSpan - 行跨度（1/2，默认 2）
 * @param data - 图表数据数组
 * @param series - 数据系列配置
 * @param xKey - X 轴对应的字段名（默认 'date'）
 * @param emptyMessage - 无数据时显示的提示文字
 * @param className - 自定义样式类名
 */
export interface BentoChartTileProps {
  title: string;
  description?: string;
  colSpan?: 2 | 3 | 4;
  rowSpan?: 1 | 2;
  data: ReadonlyArray<{ [key: string]: string | number }>;
  series: BentoChartSeries[];
  xKey?: string;
  emptyMessage?: string;
  className?: string;
}

/**
 * 检查图表数据是否有效（至少有一个非零值）
 */
function hasChartData(
  data: ReadonlyArray<{ [key: string]: string | number }>,
  series: BentoChartSeries[],
) {
  return data.some((row) =>
    series.some((s) => {
      const v = row[s.key];
      return typeof v === 'number' ? v > 0 : Number(v) > 0;
    }),
  );
}

/**
 * Bento 图表瓦片
 * - 使用 recharts BarChart 组件渲染柱状图
 * - 支持多系列数据对比
 * - 无数据时显示 EmptyState 空状态
 */
export function BentoChartTile({
  title,
  description,
  colSpan = 2,
  rowSpan = 2,
  data,
  series,
  xKey = 'date',
  emptyMessage = 'No activity in this period',
  className,
}: BentoChartTileProps) {
  const primary = series[0];
  const showChart = primary && hasChartData(data, series);

  return (
    <BentoTile colSpan={colSpan} rowSpan={rowSpan} className={className}>
      <div className="flex h-full min-h-[220px] flex-col p-4 md:p-6">
        {/* 图表标题 */}
        <div className="mb-4">
          <h3 className="text-sm font-medium">{title}</h3>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {/* 图表区域 */}
        <div className="min-h-0 flex-1">
          {showChart && primary ? (
            <ResponsiveContainer width="100%" height="100%" minHeight={160}>
              <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                <XAxis
                  dataKey={xKey}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border) / 0.5)',
                    background: 'hsl(var(--popover))',
                    fontSize: '12px',
                  }}
                />
                {series.map((s) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.label}
                    fill={s.color ?? 'hsl(var(--primary))'}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title={emptyMessage} className={cn('py-8')} />
          )}
        </div>
      </div>
    </BentoTile>
  );
}
