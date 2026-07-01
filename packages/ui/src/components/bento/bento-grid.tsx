/**
 * BentoGrid - Bento 网格容器组件
 *
 * 网格化仪表盘布局容器，基于 CSS Grid 实现自适应列数：
 * - 2 列：适合窄屏或双指标对比布局
 * - 3 列：中等宽度布局
 * - 4 列：标准仪表盘布局（默认）
 *
 * 每个 BentoTile 可独立设置 colSpan 和 rowSpan 来创建多样化布局。
 *
 * @example
 * ```tsx
 * <BentoGrid columns={4}>
 *   <BentoTile colSpan={2} rowSpan={2}>大卡片</BentoTile>
 *   <BentoTile>小卡片1</BentoTile>
 *   <BentoTile>小卡片2</BentoTile>
 * </BentoGrid>
 * ```
 */

import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

/** 列数对应的 CSS Grid 类名映射 */
const columnClass: Record<2 | 3 | 4, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
};

/**
 * BentoGrid 属性接口
 * @param columns - 桌面端网格列数（默认 4）
 * @param children - BentoTile 子元素
 * @param className - 自定义样式类名
 */
export interface BentoGridProps {
  /** 桌面端网格列数（默认 4） */
  columns?: 2 | 3 | 4;
  children: ReactNode;
  className?: string;
}

/**
 * Bento 网格容器
 * - 移动端单列
 * - 平板及以上根据 columns 显示对应列数
 * - auto-rows-min 确保每个 tile 高度自适应内容
 */
export function BentoGrid({ columns = 4, children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid auto-rows-min grid-cols-1 gap-4',
        columnClass[columns],
        className,
      )}
    >
      {children}
    </div>
  );
}
