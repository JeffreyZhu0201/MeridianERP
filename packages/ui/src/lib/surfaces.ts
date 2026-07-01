/**
 * 卡片/表格表面样式 - 带细边框环（使用 --border token，支持暗色模式）
 *
 * surfaceRing: 大圆角卡片样式，适用于需要视觉分离的卡片组件
 * surfaceRingLg: 中圆角卡片样式，适用于嵌套卡片或较小容器
 *
 * @example
 * ```tsx
 * <div class={surfaceRing}>订单卡片</div>
 * <div class={surfaceRingLg}>嵌套内容</div>
 * ```
 */
export const surfaceRing =
  'rounded-xl ring-1 ring-border' as const;

export const surfaceRingLg =
  'rounded-lg ring-1 ring-border' as const;

/**
 * Shell 导航分隔线样式（用于顶部导航/侧边栏/底部栏之间的分隔）
 *
 * shellDividerB: 底部边框分隔线（header 与主体内容之间）
 * shellDividerT: 顶部边框分隔线（footer 与主体内容之间）
 *
 * 使用 border-border/50 半透明边框，在暗色模式下更加柔和
 */
export const shellDividerB = 'border-b border-border/50' as const;
export const shellDividerT = 'border-t border-border/50' as const;
