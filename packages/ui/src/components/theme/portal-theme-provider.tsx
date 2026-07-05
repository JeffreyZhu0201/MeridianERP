'use client';

/**
 * PortalThemeProvider - 各门户专用主题 Provider
 *
 * 封装 ThemeProvider，为各门户提供独立的主题配置：
 * - 使用 class 属性切换主题（而非 data-theme）
 * - 默认跟随系统主题
 * - 页面切换时禁用过渡动画（避免闪烁）
 * - 使用独立 storageKey 区分各门户的主题偏好
 *
 * @example
 * ```tsx
 * // Admin 门户
 * <PortalThemeProvider storageKey="admin-theme">
 *   {children}
 * </PortalThemeProvider>
 *
 * // Merchant 门户
 * <PortalThemeProvider storageKey="merchant-theme">
 *   {children}
 * </PortalThemeProvider>
 * ```
 */

import { ThemeProvider } from './theme-provider';

export function PortalThemeProvider({
  storageKey,
  children,
}: {
  /** 主题偏好存储的 localStorage key */
  storageKey: string;
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey={storageKey}
    >
      {children}
    </ThemeProvider>
  );
}
