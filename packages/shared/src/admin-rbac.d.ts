export type AdminPlatformRole = 'SUPER_ADMIN' | 'FINANCE' | 'FULFILLMENT' | 'REVIEWER';
export type AdminPermission = 'dashboard' | 'users' | 'admins' | 'merchants' | 'inventory' | 'distributors' | 'orders' | 'allocations' | 'procurement' | 'withdrawals' | 'funds' | 'settlements' | 'settings' | 'diagnosis';
export declare const ADMIN_ROLE_PERMISSIONS: Record<AdminPlatformRole, AdminPermission[]>;
export declare const ADMIN_ROLE_HOME_PATH: Record<AdminPlatformRole, string>;
export declare function adminRoleHasPermission(role: string, permission: AdminPermission): boolean;
export declare function adminCanAccessPath(role: string, pathname: string): boolean;
