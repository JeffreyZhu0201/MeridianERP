import { getTranslations } from 'next-intl/server';
import { FormPageFrame } from '@meridian/ui/server';
import type { PlatformSettingsDto } from '@meridian/shared';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { ApiError, apiFetch } from '@/lib/api';
import { requireToken } from '@/lib/auth';

import { PlatformSettingsForm, PlatformSettingsPayments } from './_components/platform-settings-form';

const DEFAULT_SETTINGS: PlatformSettingsDto = {
  id: 'singleton',
  platformName: 'MeridianERP',
  supportEmail: null,
  distributorPortalEnabled: true,
  emailQueueEnabled: true,
  updatedAt: new Date(0).toISOString(),
  stripeMode: 'mock',
  stripeKeyHint: null,
  webhookUrl: 'http://localhost:3001/api/v1/store/checkout/webhooks/stripe',
};

export default async function SettingsPage() {
  const token = await requireToken();

  const t = await getTranslations('admin.settings');

  let settings = DEFAULT_SETTINGS;
  let loadError: string | null = null;

  try {
    settings = await apiFetch<PlatformSettingsDto>('/platform/settings', {}, token);
  } catch (err) {
    loadError =
      err instanceof ApiError && err.status === 404
        ? t('loadError')
        : err instanceof Error
          ? err.message
          : t('loadError');
  }

  return (
    <AdminShellWithSession>
      <div className="space-y-6">
        <FormPageFrame title={t('title')} description={t('description')}>
          {loadError ? (
            <p
              className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {loadError}
            </p>
          ) : null}
          <PlatformSettingsForm settings={settings} token={token} readOnly={!!loadError} />
        </FormPageFrame>
        {!loadError ? <PlatformSettingsPayments settings={settings} /> : null}
      </div>
    </AdminShellWithSession>
  );
}
