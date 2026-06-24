'use client';

import { useRouter } from 'next/navigation';

import { MerchantShell } from '@meridian/ui';

import { AUTH_COOKIE } from '@/lib/api';

export function MerchantShellWrapper({
  children,
  businessName,
  userEmail,
}: {
  children: React.ReactNode;
  businessName?: string;
  userEmail?: string;
}) {
  const router = useRouter();

  function handleLogout() {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
    router.push('/login');
    router.refresh();
  }

  return (
    <MerchantShell businessName={businessName} userEmail={userEmail} onLogout={handleLogout}>
      {children}
    </MerchantShell>
  );
}
