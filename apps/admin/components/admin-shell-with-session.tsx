import type { AdminSession } from '@/lib/api';
import { getAdminSession } from '@/lib/auth';

import { AdminShellWrapper } from './admin-shell-wrapper';

export async function AdminShellWithSession({
  children,
  session: sessionProp,
}: {
  children: React.ReactNode;
  session?: AdminSession | null;
}) {
  const session = sessionProp ?? (await getAdminSession());
  if (!session) return null;

  return (
    <AdminShellWrapper
      userEmail={session.email}
      role={session.role}
      permissions={session.permissions}
    >
      {children}
    </AdminShellWrapper>
  );
}
