'use client';

import { useRouter } from 'next/navigation';

import { StoreShell } from '@meridian/ui';

import { AUTH_COOKIE } from '@/lib/api';

export function StoreShellWrapper({
  children,
  storeSlug,
  storeName,
  cartCount,
  userEmail,
}: {
  children: React.ReactNode;
  storeSlug: string;
  storeName?: string;
  cartCount?: number;
  userEmail?: string;
}) {
  const router = useRouter();

  function handleLogout() {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    router.push(`/s/${storeSlug}/login`);
    router.refresh();
  }

  return (
    <StoreShell
      storeSlug={storeSlug}
      storeName={storeName}
      cartCount={cartCount}
      userEmail={userEmail}
      onLogout={userEmail ? handleLogout : undefined}
    >
      {children}
    </StoreShell>
  );
}
