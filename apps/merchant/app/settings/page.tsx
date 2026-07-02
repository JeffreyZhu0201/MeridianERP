import { getTranslations } from 'next-intl/server';
import { SettingsPageFrame } from '@meridian/ui/server';
import type { MerchantSettingsDto, TeamMember } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';

import { SettingsPanels } from './_components/settings-panels';

export default async function SettingsPage() {
  const t = await getTranslations('merchant.settings');
  const token = await getToken();
  if (!token) return null;

  const isOwner = isMerchantOwner(token);

  const [settings, team] = await Promise.all([
    apiFetch<MerchantSettingsDto>('/merchant/settings', {}, token),
    apiFetch<TeamMember[]>('/merchant/team', {}, token),
  ]);

  return (
    <MerchantShellWrapper businessName={settings.profile.businessName}>
      <SettingsPageFrame title={t('title')} description={t('description')}>
        <SettingsPanels
          settings={settings}
          team={team}
          isOwner={isOwner}
          token={token}
        />
      </SettingsPageFrame>
    </MerchantShellWrapper>
  );
}
