'use client';

/**
 * PortalLocaleProvider - 各门户专用国际化 Provider
 *
 * 封装 next-intl 的 NextIntlClientProvider，为各门户提供：
 * - 当前语言环境（locale）
 * - 翻译消息（messages）
 * - 时区配置（timeZone）
 *
 * @example
 * ```tsx
 * <PortalLocaleProvider
 *   locale="zh-CN"
 *   messages={messages}
 *   timeZone="Asia/Shanghai"
 * >
 *   {children}
 * </PortalLocaleProvider>
 * ```
 */

import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import type { ReactNode } from 'react';

/**
 * PortalLocaleProvider 属性接口
 * @param locale - 当前语言（如 'en'、'zh-CN'）
 * @param messages - 翻译消息对象
 * @param timeZone - 时区（如 'Asia/Shanghai'、'America/New_York'）
 * @param children - 子元素
 */
export interface PortalLocaleProviderProps {
  locale: string;
  messages: AbstractIntlMessages;
  timeZone: string;
  children: ReactNode;
}

export function PortalLocaleProvider({ locale, messages, timeZone, children }: PortalLocaleProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  );
}
