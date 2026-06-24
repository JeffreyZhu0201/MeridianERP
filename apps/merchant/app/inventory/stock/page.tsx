import { Suspense } from 'react';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch } from '@/lib/api';
import type { OnboardingProfile } from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';
import type { TenantInventorySettings, Warehouse } from '@meridian/shared';

import { StockLevelsTable } from './_components/stock-levels-table';
import { buildInventoryQuery } from '@/lib/inventory';
import type { StockLevelWithDetails } from '@meridian/shared';
import type { InventoryPaginated } from '@/lib/inventory';

interface StockPageProps {
  searchParams: Promise<{ warehouseId?: string; q?: string; page?: string }>;
}

export default async function StockPage({ searchParams }: StockPageProps) {
  const token = await getToken();
  if (!token) return null;

  const params = await searchParams;
  const warehouseId = params.warehouseId;
  const q = params.q;
  const page = Number(params.page ?? '1');

  const [levelsRes, warehouses, settings, profile] = await Promise.all([
    apiFetch<InventoryPaginated<StockLevelWithDetails>>(
      `/merchant/inventory/stock-levels${buildInventoryQuery({
        warehouseId,
        q,
        page,
        limit: 20,
      })}`,
      {},
      token,
    ).catch(() => ({ items: [], total: 0, page: 1, limit: 20 })),
    apiFetch<Warehouse[]>('/merchant/inventory/warehouses', {}, token).catch(() => []),
    apiFetch<TenantInventorySettings>('/merchant/inventory/settings', {}, token).catch(() => ({
      defaultReorderThreshold: 5,
    })),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Stock levels</h1>
        <Suspense>
          <StockLevelsTable
            initialLevels={levelsRes.items}
            initialTotal={levelsRes.total}
            warehouses={warehouses}
            token={token}
            isOwner={isMerchantOwner(token)}
            defaultThreshold={settings.defaultReorderThreshold}
          />
        </Suspense>
      </div>
    </MerchantShellWrapper>
  );
}
