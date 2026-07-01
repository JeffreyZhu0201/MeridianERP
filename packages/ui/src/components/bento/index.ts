/**
 * Bento 仪表盘组件导出
 *
 * 网格化仪表盘布局组件，适合展示：
 * - 关键业绩指标（KPI）
 * - 数据趋势图表
 * - 多维度数据对比
 *
 * @example
 * ```tsx
 * import { BentoGrid, BentoMetricTile, BentoChartTile } from '@meridian/ui';
 * ```
 */

/** Bento 网格容器 - 自适应列数布局 */
export { BentoGrid, type BentoGridProps } from './bento-grid';

/** Bento 瓦片基础组件 - 可指定列/行跨度 */
export { BentoTile, type BentoTileProps } from './bento-tile';

/**
 * Bento 指标瓦片相关组件和类型
 * - BentoMetricTile: 单指标展示（标题+数值+描述）
 * - BentoListHeader: 列表头部指标条
 * - BentoDetailHero: 详情页顶部指标组
 */
export {
  BentoMetricTile,
  BentoListHeader,
  BentoDetailHero,
  type BentoMetricTileProps,
  type BentoListHeaderProps,
  type BentoDetailHeroProps,
} from './bento-metric-tile';

/**
 * Bento 图表瓦片 - 柱状图展示
 * @param BentoChartTileProps - 图表配置（标题、数据、系列）
 * @param BentoChartSeries - 数据系列配置
 */
export { BentoChartTile, type BentoChartTileProps, type BentoChartSeries } from './bento-chart-tile';

/** Bento 仪表盘框架 - PageHeader + BentoGrid */
export { BentoDashboardFrame, type BentoDashboardFrameProps } from './bento-dashboard-frame';
