import { Suspense } from 'react';

import { RegisterWizard } from './_components/register-wizard';

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterWizard />
    </Suspense>
  );
}
