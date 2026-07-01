/**
 * BentoTile - Bento 瓦片基础组件
 *
 * Bento 仪表盘中的基础卡片单元，支持：
 * - 列跨度（colSpan）：占用 1-4 列
 * - 行跨度（rowSpan）：占用 1-3 行
 * - 自定义样式和 aria-label 无障碍标签
 *
 * 通常不直接使用，而是通过 BentoMetricTile、BentoChartTile 等专用瓦片组件使用。
 *
 * @example
 * ```tsx
 * <BentoTile colSpan={2} rowSpan={2}>
 *   <LargeChart />
 * </BentoTile>
 * ```
 */

import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

/** 列跨度对应的 CSS Grid 类名映射 */
const colSpanClass: Record<1 | 2 | 3 | 4, string> = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
};

/** 行跨度对应的 CSS Grid 类名映射 */
const rowSpanClass: Record<1 | 2 | 3, string> = {
  1: 'md:row-span-1',
  2: 'md:row-span-2',
  3: 'md:row-span-3',
};

/**
 * BentoTile 属性接口
 * @param colSpan - 列跨度（1-4，默认 1）
 * @param rowSpan - 行跨度（1-3，默认 1）
 * @param children - 瓦片内容
 * @param className - 自定义样式类名
 * @param aria-label - 无障碍标签
 */
export interface BentoTileProps {
  /** 列跨度（占用列数，默认 1） */
  colSpan?: 1 | 2 | 3 | 4;
  /** 行跨度（占用行数，默认 1） */
  rowSpan?: 1 | 2 | 3;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

/**
 * Bento 瓦片基础组件
 * - 圆角卡片样式（rounded-xl）
 * - 浅色边框（ring-1 ring-border）
 * - 支持灵活的跨列/跨行布局
 */
export function BentoTile({
  colSpan = 1,
  rowSpan = 1,
  children,
  className,
  'aria-label': ariaLabel,
}: BentoTileProps) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        'rounded-xl bg-card text-card-foreground ring-1 ring-border',
        colSpanClass[colSpan],
        rowSpanClass[rowSpan],
        className,
      )}
    >
      {children}
    </div>
  );
}
