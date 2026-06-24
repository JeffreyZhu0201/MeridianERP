import Link from 'next/link';
import { Suspense } from 'react';

import { PageHeader } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';
import { inventoryZh } from '@/lib/i18n/inventory-zh';
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
  const zh = inventoryZh.alerts;

  return (
    <MerchantShellWrapper businessName={profile?.businessName} lowStockAlertCount={items.length}>
      <div className="space-y-6">
        <PageHeader
          title={zh.title}
          description={zh.description(items.length)}
          action={
            isMerchantOwner(token) ? (
              <Link
                href="/inventory/settings"
                className="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
              >
                {zh.settingsLink}
              </Link>
            ) : undefined
          }
        />
        <Suspense>
          <LowStockAlertsTable items={items} />
        </Suspense>
      </div>
    </MerchantShellWrapper>
  );
}
