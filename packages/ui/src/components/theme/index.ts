/**
 * 主题与国际化组件导出
 *
 * 提供完整的主题切换和语言切换功能：
 * - ThemeProvider: 暗色模式支持（基于 next-themes）
 * - ModeToggle: 明/暗/系统主题切换下拉菜单
 * - LocaleToggle: 中英文切换下拉菜单
 * - PortalThemeProvider: 各门户专用主题 Provider
 * - PortalLocaleProvider: 各门户专用国际化 Provider
 * - AuthToolbar: 认证页工具栏（主题+语言切换）
 *
 * @example
 * ```tsx
 * import { ThemeProvider, ModeToggle, LocaleToggle } from '@meridian/ui';
 * ```
 */

/** 主题 Provider - 暗色模式支持 */
export { ThemeProvider } from './theme-provider';

/** 主题切换下拉菜单 */
export { ModeToggle } from './mode-toggle';

/** 语言切换下拉菜单 */
export { LocaleToggle } from './locale-toggle';

/** 各门户专用主题 Provider */
export { PortalThemeProvider } from './portal-theme-provider';

/** 各门户专用国际化 Provider */
export { PortalLocaleProvider } from './portal-locale-provider';

/** 认证页工具栏 */
export { AuthToolbar } from './auth-toolbar';
