export const MERCHANT_PLUGIN_CODES = [
  'crm',
  'hrm',
  'im',
  'finance_tax',
  'oa',
  'e_signature',
  'customer_service',
] as const;

export type MerchantPluginCode = (typeof MERCHANT_PLUGIN_CODES)[number];

export type PluginCatalogStatus = 'ACTIVE' | 'COMING_SOON' | 'DEPRECATED';

export type TenantPluginStatus = 'INSTALLED' | 'UNINSTALLED';

export type PluginCategory =
  | 'sales'
  | 'hr'
  | 'communication'
  | 'finance'
  | 'productivity'
  | 'compliance';

export interface PluginNavRoute {
  href: string;
  labelKey: string;
}

export interface MerchantPluginDefinitionDto {
  code: MerchantPluginCode;
  category: PluginCategory;
  icon: string;
  sortOrder: number;
  nameKey: string;
  descriptionKey: string;
  navRoutes: PluginNavRoute[] | null;
  status: PluginCatalogStatus;
  isDefaultOnSignup: boolean;
}

export interface MerchantPluginCatalogItem extends MerchantPluginDefinitionDto {
  installed: boolean;
  installedAt: string | null;
}

export interface MerchantPluginCatalogResponse {
  items: MerchantPluginCatalogItem[];
}

export interface MerchantInstalledPluginsResponse {
  codes: MerchantPluginCode[];
}

export interface PlatformMerchantPluginItem {
  code: MerchantPluginCode;
  nameKey: string;
  installed: boolean;
  installedAt: string | null;
  uninstalledAt: string | null;
}

export interface PlatformMerchantPluginsResponse {
  tenantId: string;
  plugins: PlatformMerchantPluginItem[];
}

export const PLUGIN_NOT_INSTALLED = 'PLUGIN_NOT_INSTALLED';

export const MERCHANT_PLUGIN_ROUTE_BY_CODE: Record<MerchantPluginCode, string> = {
  crm: '/crm/contacts',
  hrm: '/hrm',
  im: '/im',
  finance_tax: '/finance-tax',
  oa: '/oa',
  e_signature: '/e-signature',
  customer_service: '/customer-service',
};

export const MERCHANT_PLUGIN_STUB_CODES = MERCHANT_PLUGIN_CODES.filter(
  (code) => code !== 'crm',
);
