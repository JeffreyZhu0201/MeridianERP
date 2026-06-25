export const locales = ['en', 'zh-CN'] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'en';

export type PortalId = 'admin' | 'merchant' | 'store' | 'distributor';

export function localeCookieName(portal: PortalId): string {
  return `meridian_locale_${portal}`;
}

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return value === 'en' || value === 'zh-CN';
}
