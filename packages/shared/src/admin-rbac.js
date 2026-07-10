"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_ROLE_HOME_PATH = exports.ADMIN_ROLE_PERMISSIONS = void 0;
exports.adminRoleHasPermission = adminRoleHasPermission;
exports.adminCanAccessPath = adminCanAccessPath;
exports.ADMIN_ROLE_PERMISSIONS = {
    SUPER_ADMIN: [
        'dashboard',
        'users',
        'admins',
        'merchants',
        'inventory',
        'distributors',
        'orders',
        'allocations',
        'procurement',
        'withdrawals',
        'funds',
        'settlements',
        'settings',
        'diagnosis',
    ],
    FINANCE: ['dashboard', 'withdrawals', 'funds', 'settlements', 'diagnosis'],
    FULFILLMENT: ['dashboard', 'orders', 'allocations', 'procurement'],
    REVIEWER: ['dashboard', 'merchants', 'procurement', 'withdrawals'],
};
exports.ADMIN_ROLE_HOME_PATH = {
    SUPER_ADMIN: '/',
    FINANCE: '/funds',
    FULFILLMENT: '/allocations',
    REVIEWER: '/merchants',
};
const PATH_PERMISSION_MAP = [
    { prefix: '/admins', permission: 'admins' },
    { prefix: '/users', permission: 'users' },
    { prefix: '/merchants', permission: 'merchants' },
    { prefix: '/inventory', permission: 'inventory' },
    { prefix: '/distributors', permission: 'distributors' },
    { prefix: '/orders', permission: 'orders' },
    { prefix: '/allocations', permission: 'allocations' },
    { prefix: '/procurement', permission: 'procurement' },
    { prefix: '/replenishment', permission: 'procurement' },
    { prefix: '/withdrawals', permission: 'withdrawals' },
    { prefix: '/funds', permission: 'funds' },
    { prefix: '/settlements', permission: 'withdrawals' },
    { prefix: '/settings', permission: 'settings' },
    { prefix: '/diagnosis', permission: 'diagnosis' },
    { prefix: '/flagship-catalog', permission: 'inventory' },
];
function adminRoleHasPermission(role, permission) {
    const permissions = exports.ADMIN_ROLE_PERMISSIONS[role];
    if (!permissions)
        return false;
    return permissions.includes(permission);
}
function adminCanAccessPath(role, pathname) {
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
//# sourceMappingURL=admin-rbac.js.map