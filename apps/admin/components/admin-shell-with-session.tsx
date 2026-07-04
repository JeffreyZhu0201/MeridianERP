import type { AdminSession } from '@/lib/api';
import { requireAdminSession } from '@/lib/auth';

import { AdminShellWrapper } from './admin-shell-wrapper';

export async function AdminShellWithSession({
  children,
  session: sessionProp,
}: {
  children: React.ReactNode;
  session?: AdminSession | null;
}) {
  const session = sessionProp ?? (await requireAdminSession());

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
