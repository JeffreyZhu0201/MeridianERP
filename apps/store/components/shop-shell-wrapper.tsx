'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { StoreShell } from '@meridian/ui';
import type { StoreMerchantApplicationStatus } from '@meridian/shared';

import { BranchSelect } from '@/components/branch-select';
import { AUTH_COOKIE, apiFetch } from '@/lib/api';

function readAuthToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${AUTH_COOKIE}=`))
    ?.split('=')[1];
}

export function ShopShellWrapper({
  children,
  fulfillmentSlug,
  storeName,
  cartCount,
  userEmail,
  showBecomeMerchant: showBecomeMerchantProp,
}: {
  children: React.ReactNode;
  fulfillmentSlug: string;
  storeName?: string;
  cartCount?: number;
  userEmail?: string;
  showBecomeMerchant?: boolean;
}) {
  const router = useRouter();
  const [showBecomeMerchant, setShowBecomeMerchant] = useState(showBecomeMerchantProp ?? false);

  useEffect(() => {
    if (showBecomeMerchantProp !== undefined) {
      setShowBecomeMerchant(showBecomeMerchantProp);
      return;
    }
    if (!userEmail) {
      setShowBecomeMerchant(false);
      return;
    }
    const token = readAuthToken();
    if (!token) {
      setShowBecomeMerchant(false);
      return;
    }
    let cancelled = false;
    void apiFetch<StoreMerchantApplicationStatus | null>(
      '/store/merchant-applications/me',
      {},
      token,
    )
      .then((application) => {
        if (cancelled) return;
        const approved = application?.onboardingStatus === 'APPROVED';
        setShowBecomeMerchant(!approved);
      })
      .catch(() => {
        if (!cancelled) setShowBecomeMerchant(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userEmail, showBecomeMerchantProp]);

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
      showBecomeMerchant={showBecomeMerchant}
    >
      {children}
    </StoreShell>
  );
}
