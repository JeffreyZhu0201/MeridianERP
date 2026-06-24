import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';
import type { TenantInventorySettings } from '@meridian/shared';

import {
  InventorySettingsForm,
  StaffForbidden,
} from './_components/inventory-settings-form';

export default async function InventorySettingsPage() {
  const token = await getToken();
  if (!token) return null;

  const isOwner = isMerchantOwner(token);

  const [settings, profile] = await Promise.all([
    apiFetch<TenantInventorySettings>('/merchant/inventory/settings', {}, token).catch(() => ({
      defaultReorderThreshold: 5,
    })),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Inventory settings</h1>
        {isOwner ? (
          <InventorySettingsForm
            defaultReorderThreshold={settings.defaultReorderThreshold}
            token={token}
          />
        ) : (
          <StaffForbidden />
        )}
      </div>
    </MerchantShellWrapper>
  );
}
