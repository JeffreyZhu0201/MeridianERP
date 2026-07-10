export declare const locales: readonly ["en", "zh-CN"];
export type AppLocale = (typeof locales)[number];
export declare const defaultLocale: AppLocale;
export type PortalId = 'admin' | 'merchant' | 'store' | 'distributor';
export declare function localeCookieName(portal: PortalId): string;
export declare function isAppLocale(value: string | undefined | null): value is AppLocale;
