import { Suspense } from 'react';

import { PageHeader } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';
import { inventoryZh } from '@/lib/i18n/inventory-zh';
import type { OnboardingProfile } from '@/lib/api';
import type { Warehouse } from '@meridian/shared';

import { WarehousesTable } from './_components/warehouses-table';

/** 商户端 — 仓库列表页（服务端拉取仓库数据） */
export default async function WarehousesPage() {
  const token = await getToken();
  if (!token) return null;

  const [warehouses, profile] = await Promise.all([
    apiFetch<Warehouse[]>('/merchant/inventory/warehouses', {}, token).catch(() => []),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const zh = inventoryZh.warehouses;

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <PageHeader title={zh.title} description={zh.description} />
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
