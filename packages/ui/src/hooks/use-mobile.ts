'use client';

/**
 * 检测当前设备是否为移动设备的 Hook
 *
 * 使用 window.matchMedia API 监听视口宽度变化，返回布尔值表示是否为移动设备。
 * 移动端判定标准：视口宽度小于 768px（MD 断点）
 *
 * @returns boolean | undefined - true 表示移动设备，false 表示桌面设备，undefined 表示服务端渲染或初始加载中
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *
 *   if (isMobile === undefined) return <Loading />;
 *   return isMobile ? <MobileLayout /> : <DesktopLayout />;
 * }
 * ```
 *
 * @note
 * - 需要在客户端组件（'use client'）中使用
 * - 在 SSR 期间返回 undefined，需要做好加载状态处理
 * - 使用 matchMedia 的 change 事件实时响应屏幕尺寸变化
 */
import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
