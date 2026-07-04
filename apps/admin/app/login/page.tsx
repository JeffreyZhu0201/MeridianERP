import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { getAdminSession } from '@/lib/auth';
import { ADMIN_ROLE_HOME_PATH, type AdminPlatformRole } from '@meridian/shared';

import { LoginForm } from './_components/login-form';

export default async function LoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect(ADMIN_ROLE_HOME_PATH[session.role as AdminPlatformRole] ?? '/');
  }

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
