import { Suspense } from 'react';
import { AuthToolbar } from '@meridian/ui';

import { LoginForm } from './_components/login-form';

export default function LoginPage() {
  return (
    <>
      <AuthToolbar portal="admin" />
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
