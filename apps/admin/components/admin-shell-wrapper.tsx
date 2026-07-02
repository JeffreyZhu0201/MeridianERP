'use client';

import { useRouter } from 'next/navigation';

import { AdminShell } from '@meridian/ui';

import { AUTH_COOKIE } from '@/lib/api';

export function AdminShellWrapper({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string;
}) {
  const router = useRouter();

  function handleLogout() {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    router.push('/login');
    router.refresh();
  }

  return (
    <AdminShell userEmail={userEmail} onLogout={handleLogout}>
      {children}
    </AdminShell>
  );
}
