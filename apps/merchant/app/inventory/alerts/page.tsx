import Link from 'next/link';
import { Suspense } from 'react';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';
import type { LowStockAlertItem } from '@meridian/shared';

import { LowStockAlertsTable } from './_components/low-stock-alerts-table';

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

  return (
    <MerchantShellWrapper businessName={profile?.businessName} lowStockAlertCount={items.length}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Low-stock alerts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {items.length} variant{items.length === 1 ? '' : 's'} at or below reorder threshold
              (default warehouse)
            </p>
          </div>
          {isMerchantOwner(token) ? (
            <Link
              href="/inventory/settings"
              className="text-sm text-primary hover:underline"
            >
              Inventory settings
            </Link>
          ) : null}
        </div>
        <Suspense>
          <LowStockAlertsTable items={items} />
        </Suspense>
      </div>
    </MerchantShellWrapper>
  );
}
