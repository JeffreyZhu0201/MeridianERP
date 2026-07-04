import { getTranslations } from 'next-intl/server';
import { SettingsPageFrame } from '@meridian/ui/server';
import type {
  MerchantSession,
  MerchantSettingsDto,
  ProcurementReceivingAddress,
  TeamMember,
} from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';

import { MerchantOwnerProfileHero } from './_components/merchant-owner-profile-hero';
import { SettingsPanels } from './_components/settings-panels';

export default async function SettingsPage() {
  const t = await getTranslations('merchant.settings');
  const token = await getToken();
  if (!token) return null;

  const isOwner = isMerchantOwner(token);

  const [settings, team, procurementAddresses, session] = await Promise.all([
    apiFetch<MerchantSettingsDto>('/merchant/settings', {}, token),
    apiFetch<TeamMember[]>('/merchant/team', {}, token),
    apiFetch<ProcurementReceivingAddress[]>(
      '/merchant/settings/procurement-addresses',
      {},
      token,
    ).catch(() => []),
    apiFetch<MerchantSession>('/merchant/auth/me', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={settings.profile.businessName}>
      <SettingsPageFrame title={t('title')} description={t('description')}>
        <div className="space-y-6">
          {session ? <MerchantOwnerProfileHero session={session} /> : null}
          <SettingsPanels
            settings={settings}
            team={team}
            procurementAddresses={procurementAddresses}
            isOwner={isOwner}
            token={token}
          />
        </div>
      </SettingsPageFrame>
    </MerchantShellWrapper>
  );
}
