'use client';

/**
 * ThemeProvider - 主题切换 Provider 组件
 *
 * 基于 next-themes 库实现暗色模式支持：
 * - 自动检测系统主题偏好
 * - 支持手动切换亮/暗/系统主题
 * - 主题切换时无闪烁（hydrates correctly）
 *
 * @example
 * ```tsx
 * // 在 app 根布局中使用
 * <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
 *   {children}
 * </ThemeProvider>
 * ```
 */

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
