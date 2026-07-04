'use client';

import { useRouter } from 'next/navigation';

import type { AdminPermission } from '@meridian/shared';
import { AdminShell } from '@meridian/ui';

import { ADMIN_ROLE_COOKIE, AUTH_COOKIE } from '@/lib/api';
import { AdminPageTitle } from '@/components/admin-page-title';

export function AdminShellWrapper({
  children,
  userEmail,
  role,
  permissions,
}: {
  children: React.ReactNode;
  userEmail?: string;
  role?: string;
  permissions?: AdminPermission[];
}) {
  const router = useRouter();

  function handleLogout() {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `${ADMIN_ROLE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    router.push('/login');
    router.refresh();
  }

  return (
    <AdminShell
      userEmail={userEmail}
      role={role}
      permissions={permissions}
      onLogout={handleLogout}
      headerStart={<AdminPageTitle />}
    >
      {children}
    </AdminShell>
  );
}
