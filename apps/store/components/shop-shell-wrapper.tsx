'use client';

import { useRouter } from 'next/navigation';

import { StoreShell } from '@meridian/ui';

import { BranchSelect } from '@/components/branch-select';
import { AUTH_COOKIE } from '@/lib/api';

export function ShopShellWrapper({
  children,
  fulfillmentSlug,
  storeName,
  cartCount,
  userEmail,
}: {
  children: React.ReactNode;
  fulfillmentSlug: string;
  storeName?: string;
  cartCount?: number;
  userEmail?: string;
}) {
  const router = useRouter();

  function handleLogout() {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    router.push('/login');
    router.refresh();
  }

  return (
    <StoreShell
      storeSlug={fulfillmentSlug}
      storeName={storeName}
      cartCount={cartCount}
      userEmail={userEmail}
      basePath="/shop"
      branchSelect={<BranchSelect currentSlug={fulfillmentSlug} />}
      onLogout={userEmail ? handleLogout : undefined}
    >
      {children}
    </StoreShell>
  );
}
