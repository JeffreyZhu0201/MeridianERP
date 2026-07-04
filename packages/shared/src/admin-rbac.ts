export type AdminPlatformRole =
  | 'SUPER_ADMIN'
  | 'FINANCE'
  | 'FULFILLMENT'
  | 'REVIEWER';

export type AdminPermission =
  | 'dashboard'
  | 'users'
  | 'admins'
  | 'merchants'
  | 'inventory'
  | 'distributors'
  | 'orders'
  | 'allocations'
  | 'replenishment'
  | 'procurement'
  | 'withdrawals'
  | 'funds'
  | 'settlements'
  | 'crm'
  | 'settings';

export const ADMIN_ROLE_PERMISSIONS: Record<AdminPlatformRole, AdminPermission[]> = {
  SUPER_ADMIN: [
    'dashboard',
    'users',
    'admins',
    'merchants',
    'inventory',
    'distributors',
    'orders',
    'allocations',
    'replenishment',
    'procurement',
    'withdrawals',
    'funds',
    'settlements',
    'crm',
    'settings',
  ],
  FINANCE: ['dashboard', 'withdrawals', 'funds', 'settlements'],
  FULFILLMENT: ['dashboard', 'orders', 'allocations', 'replenishment', 'procurement'],
  REVIEWER: ['dashboard', 'merchants', 'replenishment', 'procurement', 'withdrawals'],
};

export const ADMIN_ROLE_HOME_PATH: Record<AdminPlatformRole, string> = {
  SUPER_ADMIN: '/',
  FINANCE: '/funds',
  FULFILLMENT: '/orders',
  REVIEWER: '/merchants',
};

const PATH_PERMISSION_MAP: Array<{ prefix: string; permission: AdminPermission }> = [
  { prefix: '/admins', permission: 'admins' },
  { prefix: '/users', permission: 'users' },
  { prefix: '/merchants', permission: 'merchants' },
  { prefix: '/inventory', permission: 'inventory' },
  { prefix: '/distributors', permission: 'distributors' },
  { prefix: '/orders', permission: 'orders' },
  { prefix: '/allocations', permission: 'allocations' },
  { prefix: '/procurement', permission: 'procurement' },
  { prefix: '/replenishment', permission: 'replenishment' },
  { prefix: '/withdrawals', permission: 'withdrawals' },
  { prefix: '/funds', permission: 'funds' },
  { prefix: '/settlements', permission: 'settlements' },
  { prefix: '/crm', permission: 'crm' },
  { prefix: '/settings', permission: 'settings' },
  { prefix: '/flagship-catalog', permission: 'inventory' },
];

export function adminRoleHasPermission(
  role: string,
  permission: AdminPermission,
): boolean {
  const permissions = ADMIN_ROLE_PERMISSIONS[role as AdminPlatformRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function adminCanAccessPath(role: string, pathname: string): boolean {
  const normalized = pathname === '/' || pathname === '' ? '/dashboard' : pathname;
  if (normalized === '/dashboard' || normalized.startsWith('/dashboard')) {
    return adminRoleHasPermission(role, 'dashboard');
  }

  for (const { prefix, permission } of PATH_PERMISSION_MAP) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return adminRoleHasPermission(role, permission);
    }
  }

  return adminRoleHasPermission(role, 'dashboard');
}
