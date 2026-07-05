export interface PortalLink {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  href: string;
  port: number;
  accent: 'copper' | 'mist' | 'paper';
}

function envUrl(keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return fallback;
}

/** Local dev defaults; override via NEXT_PUBLIC_*_URL or *_APP_URL in production. */
export const portals: PortalLink[] = [
  {
    id: 'admin',
    title: '总部管理',
    titleEn: 'Factory HQ',
    description: 'CRM、主 SKU 配货、配送发货、资金与提现审批',
    href: envUrl(['NEXT_PUBLIC_ADMIN_URL', 'ADMIN_APP_URL'], 'http://localhost:3000'),
    port: 3000,
    accent: 'copper',
  },
  {
    id: 'merchant',
    title: '分店商户',
    titleEn: 'Branch merchant',
    description: '销售、CRM 插件、库存、核销与总部进货',
    href: envUrl(['NEXT_PUBLIC_MERCHANT_URL', 'MERCHANT_APP_URL'], 'http://localhost:3002'),
    port: 3002,
    accent: 'paper',
  },
  {
    id: 'store',
    title: '消费者商城',
    titleEn: 'Storefront',
    description: '统一旗舰目录、购物车、结账与订单',
    href: envUrl(['NEXT_PUBLIC_STORE_URL', 'STORE_APP_URL'], 'http://localhost:3003/shop'),
    port: 3003,
    accent: 'mist',
  },
  {
    id: 'distributor',
    title: '拓店员',
    titleEn: 'Sales promoter',
    description: '招募分店、业绩视图、佣金台账与提现',
    href: envUrl(['NEXT_PUBLIC_DISTRIBUTOR_URL', 'DISTRIBUTOR_APP_URL'], 'http://localhost:3005'),
    port: 3005,
    accent: 'copper',
  },
];

export const apiUrl = envUrl(['NEXT_PUBLIC_API_URL', 'API_URL'], 'http://localhost:3001');
