'use client';

import { useRouter } from 'next/navigation';

import { DistributorShell } from '@meridian/ui';

import { AUTH_COOKIE } from '@/lib/api';

export function DistributorShellWrapper({
  children,
  distributorName,
}: {
  children: React.ReactNode;
  distributorName?: string;
}) {
  const router = useRouter();

  function handleLogout() {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    router.push('/login');
    router.refresh();
  }

  return (
    <DistributorShell distributorName={distributorName} onLogout={handleLogout}>
      {children}
    </DistributorShell>
  );
}
