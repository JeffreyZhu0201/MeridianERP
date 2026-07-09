import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { LoginForm } from './_components/login-form';

export default async function LoginPage() {
  const t = await getTranslations('distributor.login');
  const labels = {
    subtitle: t('subtitle'),
    email: t('email'),
    password: t('password'),
    tenantSlug: t('tenantSlug'),
    tenantSlugPlaceholder: t('tenantSlugPlaceholder'),
    tenantSlugHint: t('tenantSlugHint'),
    invalidCredentials: t('invalidCredentials'),
    signInFailed: t('signInFailed'),
    signingIn: t('signingIn'),
    submit: t('submit'),
  };

  return (
    <Suspense>
      <LoginForm labels={labels} />
    </Suspense>
  );
}
