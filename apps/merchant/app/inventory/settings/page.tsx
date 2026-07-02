import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { SettingsPageFrame } from '@meridian/ui/server';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import type { TenantInventorySettings } from '@meridian/shared';

import {
  InventorySettingsForm,
  StaffForbidden,
} from './_components/inventory-settings-form';
export default async function InventorySettingsPage() {
  const token = await getToken();
  if (!token) return null;

  const isOwner = isMerchantOwner(token);
  const t = await getTranslations('merchant.inventory.settings');

  const [settings, profile] = await Promise.all([
    apiFetch<TenantInventorySettings>('/merchant/inventory/settings', {}, token).catch(() => ({
      defaultReorderThreshold: 5,
    })),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <SettingsPageFrame title={t('title')} description={t('description')}>
        {isOwner ? (
          <InventorySettingsForm
            defaultReorderThreshold={settings.defaultReorderThreshold}
            token={token}
          />
        ) : (
          <StaffForbidden />
        )}
      </SettingsPageFrame>
    </MerchantShellWrapper>
  );
}
