import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { PageHeader } from '@meridian/ui';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';
import { inventoryZh } from '@/lib/i18n/inventory-zh';
import type { TenantInventorySettings } from '@meridian/shared';

import {
  InventorySettingsForm,
  StaffForbidden,
} from './_components/inventory-settings-form';

/** 商户端 — 租户级库存参数（仅主账号可编辑） */
export default async function InventorySettingsPage() {
  const token = await getToken();
  if (!token) return null;

  const isOwner = isMerchantOwner(token);
  const zh = inventoryZh.settings;

  const [settings, profile] = await Promise.all([
    apiFetch<TenantInventorySettings>('/merchant/inventory/settings', {}, token).catch(() => ({
      defaultReorderThreshold: 5,
    })),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <PageHeader title={zh.title} description={zh.description} />
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
