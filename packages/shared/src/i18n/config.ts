/*
 * @Author: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @Date: 2026-06-25 13:53:43
 * @LastEditors: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @LastEditTime: 2026-07-02 14:56:21
 * @FilePath: /MeridianERP/packages/shared/src/i18n/config.ts
 * @Description: Config for the i18n
 * 
 * Copyright (c) 2026 by JeffreyZhu, All Rights Reserved. 
 */
export const locales = ['en', 'zh-CN'] as const;
export type AppLocale = (typeof locales)[number]; // AppLocale is the type of the locale

export const defaultLocale: AppLocale = 'en';

export type PortalId = 'admin' | 'merchant' | 'store' | 'distributor'; // PortalId is the type of the portal

export function localeCookieName(portal: PortalId): string {
  return `meridian_locale_${portal}`;
}

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return value === 'en' || value === 'zh-CN';
}
