export interface PluginNavRoute {
  href: string;
  labelKey: string;
}

export type PluginSeedCode =
  | 'crm'
  | 'hrm'
  | 'im'
  | 'finance_tax'
  | 'oa'
  | 'e_signature'
  | 'customer_service';

export interface PluginSeedDefinition {
  code: PluginSeedCode;
  category: string;
  icon: string;
  sortOrder: number;
  nameKey: string;
  descriptionKey: string;
  navRoutes: PluginNavRoute[] | null;
  isDefaultOnSignup: boolean;
}

export const PLUGIN_CATALOG_SEED: PluginSeedDefinition[] = [
  {
    code: 'crm',
    category: 'sales',
    icon: 'IconAddressBook',
    sortOrder: 10,
    nameKey: 'merchant.plugins.items.crm.name',
    descriptionKey: 'merchant.plugins.items.crm.description',
    navRoutes: [
      { href: '/crm/contacts', labelKey: 'crmContacts' },
      { href: '/crm/companies', labelKey: 'crmCompanies' },
      { href: '/crm/leads', labelKey: 'crmLeads' },
      { href: '/crm/activities', labelKey: 'crmActivities' },
    ],
    isDefaultOnSignup: true,
  },
  {
    code: 'hrm',
    category: 'hr',
    icon: 'IconUsers',
    sortOrder: 20,
    nameKey: 'merchant.plugins.items.hrm.name',
    descriptionKey: 'merchant.plugins.items.hrm.description',
    navRoutes: [{ href: '/hrm', labelKey: 'hrm' }],
    isDefaultOnSignup: false,
  },
  {
    code: 'im',
    category: 'communication',
    icon: 'IconMessages',
    sortOrder: 30,
    nameKey: 'merchant.plugins.items.im.name',
    descriptionKey: 'merchant.plugins.items.im.description',
    navRoutes: [{ href: '/im', labelKey: 'im' }],
    isDefaultOnSignup: false,
  },
  {
    code: 'finance_tax',
    category: 'finance',
    icon: 'IconReceiptTax',
    sortOrder: 40,
    nameKey: 'merchant.plugins.items.finance_tax.name',
    descriptionKey: 'merchant.plugins.items.finance_tax.description',
    navRoutes: [{ href: '/finance-tax', labelKey: 'financeTax' }],
    isDefaultOnSignup: false,
  },
  {
    code: 'oa',
    category: 'productivity',
    icon: 'IconClipboardList',
    sortOrder: 50,
    nameKey: 'merchant.plugins.items.oa.name',
    descriptionKey: 'merchant.plugins.items.oa.description',
    navRoutes: [{ href: '/oa', labelKey: 'oa' }],
    isDefaultOnSignup: false,
  },
  {
    code: 'e_signature',
    category: 'compliance',
    icon: 'IconWritingSign',
    sortOrder: 60,
    nameKey: 'merchant.plugins.items.e_signature.name',
    descriptionKey: 'merchant.plugins.items.e_signature.description',
    navRoutes: [{ href: '/e-signature', labelKey: 'eSignature' }],
    isDefaultOnSignup: false,
  },
  {
    code: 'customer_service',
    category: 'communication',
    icon: 'IconHeadset',
    sortOrder: 70,
    nameKey: 'merchant.plugins.items.customer_service.name',
    descriptionKey: 'merchant.plugins.items.customer_service.description',
    navRoutes: [{ href: '/customer-service', labelKey: 'customerService' }],
    isDefaultOnSignup: false,
  },
];
