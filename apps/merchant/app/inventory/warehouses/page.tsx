import { Suspense } from 'react';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';
import type { OnboardingProfile } from '@/lib/api';
import type { Warehouse } from '@meridian/shared';

import { WarehousesTable } from './_components/warehouses-table';

export default async function WarehousesPage() {
  const token = await getToken();
  if (!token) return null;

  const [warehouses, profile] = await Promise.all([
    apiFetch<Warehouse[]>('/merchant/inventory/warehouses', {}, token).catch(() => []),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Warehouses</h1>
        </div>
        <Suspense>
          <WarehousesTable
            warehouses={warehouses}
            token={token}
            isOwner={isMerchantOwner(token)}
          />
        </Suspense>
      </div>
    </MerchantShellWrapper>
  );
}
