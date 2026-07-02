'use client';

import type { MerchantSettingsDto, TeamMember } from '@meridian/shared';

import { CommissionDefaultsPanel } from './commission-defaults-panel';
import { MerchantProfilePanel } from './merchant-profile-panel';
import { NotificationSettingsPanel } from './notification-settings-panel';
import { PaymentSettingsPanel } from './payment-settings-panel';
import { TeamManagementPanel } from './team-management-panel';

interface SettingsPanelsProps {
  settings: MerchantSettingsDto;
  team: TeamMember[];
  isOwner: boolean;
  token: string;
}

export function SettingsPanels({ settings, team, isOwner, token }: SettingsPanelsProps) {
  return (
    <>
      <MerchantProfilePanel profile={settings.profile} isOwner={isOwner} token={token} />
      <TeamManagementPanel team={team} isOwner={isOwner} token={token} />
      <CommissionDefaultsPanel
        settings={{
          defaultCommissionRate: settings.defaultCommissionRate,
          defaultCommissionType: settings.defaultCommissionType,
        }}
        isOwner={isOwner}
        token={token}
      />
      <NotificationSettingsPanel
        settings={{
          notifyOnBinding: settings.notifyOnBinding,
          notifyOnCommission: settings.notifyOnCommission,
        }}
        isOwner={isOwner}
        token={token}
      />
      <PaymentSettingsPanel
        settings={{ storeUrl: settings.storeUrl, stripeMode: settings.stripeMode }}
      />
    </>
  );
}
