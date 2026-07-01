/**
 * 页面框架组件导出
 *
 * 提供标准化的页面布局模板：
 * - ErpShell: 通用 ERP Shell（侧边栏+主内容区）
 * - ListPageFrame: 列表页框架（标题+筛选器+表格）
 * - DetailPageFrame: 详情页框架（面包屑+标题+操作+卡片）
 * - FormPageFrame: 表单页框架（标题+Card包裹的表单）
 * - SettingsPageFrame: 设置页框架（堆叠式设置卡片）
 * - BindPageFrame: 绑定页框架（居中状态卡片）
 * - DashboardPageFrame: 仪表盘页框架（标题+指标区）
 * - AuthStatusFrame: 认证状态页框架（居中状态卡片）
 *
 * @example
 * ```tsx
 * import { ListPageFrame, DetailPageFrame, FormPageFrame } from '@meridian/ui';
 * ```
 */

/** 通用 ERP Shell - 推荐使用 */
export { ErpShell, type ErpShellProps } from './erp-shell';

/** 列表页框架 */
export { ListPageFrame, type ListPageFrameProps } from './list-page-frame';

/** 详情页框架 */
export { DetailPageFrame, type DetailPageFrameProps } from './detail-page-frame';

/** 表单页框架 */
export { FormPageFrame, type FormPageFrameProps } from './form-page-frame';

/** 设置页框架 */
export { SettingsPageFrame, type SettingsPageFrameProps } from './settings-page-frame';

/** 绑定页框架 */
export { BindPageFrame, type BindPageFrameProps } from './bind-page-frame';

/** 仪表盘页框架 */
export { DashboardPageFrame, type DashboardPageFrameProps } from './dashboard-page-frame';

/** 认证状态页框架 */
export { AuthStatusFrame, type AuthStatusFrameProps } from './auth-status-frame';
