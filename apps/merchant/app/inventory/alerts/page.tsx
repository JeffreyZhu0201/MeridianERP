import Link from 'next/link';
import { Suspense } from 'react';

import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import type { LowStockAlertItem } from '@meridian/shared';

import { LowStockAlertsTable } from './_components/low-stock-alerts-table';

/** 商户端 — 低库存预警列表 */
export default async function AlertsPage() {
  const token = await getToken();
  if (!token) return null;

  const [alertsRes, profile] = await Promise.all([
    apiFetch<{ items: LowStockAlertItem[] }>('/merchant/inventory/alerts/low-stock', {}, token).catch(
      () => ({ items: [] }),
    ),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const items = alertsRes.items;
  const t = await getTranslations('merchant.inventory.alerts');

  const uniqueWarehouses = new Set(items.map((i) => i.warehouseId)).size;
  const tWh = await getTranslations('merchant.inventory.warehouses');

  return (
    <MerchantShellWrapper businessName={profile?.businessName} lowStockAlertCount={items.length}>
      <ListPageFrame
        title={t('title')}
        description={t('description', { count: items.length })}
        action={
          isMerchantOwner(token) ? (
            <Link
              href="/inventory/settings"
              className="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
            >
              {t('settingsLink')}
            </Link>
          ) : undefined
        }
      >
        <BentoListHeader
          metrics={[
            { title: t('title'), value: items.length },
            { title: t('onHand'), value: items.reduce((sum, i) => sum + i.quantityOnHand, 0) },
            { title: tWh('title'), value: uniqueWarehouses },
          ]}
        />
        <Suspense>
          <LowStockAlertsTable items={items} />
        </Suspense>
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
