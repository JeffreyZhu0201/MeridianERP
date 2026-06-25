'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@meridian/ui';
import type { PlatformSettingsDto } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface PlatformSettingsFormProps {
  settings: PlatformSettingsDto;
  token: string;
  readOnly?: boolean;
}

export function PlatformSettingsForm({ settings, token, readOnly = false }: PlatformSettingsFormProps) {
  const router = useRouter();
  const t = useTranslations('admin.settings');
  const tc = useTranslations('common');

  const [platformName, setPlatformName] = useState(settings.platformName);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail ?? '');
  const [distributorPortalEnabled, setDistributorPortalEnabled] = useState(
    settings.distributorPortalEnabled,
  );
  const [emailQueueEnabled, setEmailQueueEnabled] = useState(settings.emailQueueEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await apiFetch('/platform/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          platformName,
          supportEmail: supportEmail || undefined,
          distributorPortalEnabled,
          emailQueueEnabled,
        }),
      }, token);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('platform')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="max-w-lg space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform-name">{t('platformName')}</Label>
              <Input
                id="platform-name"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                disabled={readOnly}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">{t('supportEmail')}</Label>
              <Input
                id="support-email"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={distributorPortalEnabled}
                  onChange={(e) => setDistributorPortalEnabled(e.target.checked)}
                  disabled={readOnly}
                  className="size-4 rounded border"
                />
                {t('distributorPortal')}
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={emailQueueEnabled}
                  onChange={(e) => setEmailQueueEnabled(e.target.checked)}
                  disabled={readOnly}
                  className="size-4 rounded border"
                />
                {t('emailQueue')}
              </label>
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {saved ? (
              <p className="text-sm text-emerald-600" role="status">
                {t('saved')}
              </p>
            ) : null}
            <Button type="submit" disabled={saving || readOnly}>
              {saving ? t('saving') : t('save')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('payments')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">{t('stripeMode')}</p>
            <Badge variant={settings.stripeMode === 'live' ? 'default' : 'secondary'}>
              {settings.stripeMode === 'live' ? t('stripeLive') : t('stripeMock')}
            </Badge>
          </div>
          {settings.stripeKeyHint ? (
            <div>
              <p className="text-xs text-muted-foreground">{t('stripeKeyHint')}</p>
              <p className="font-mono text-sm">{settings.stripeKeyHint}</p>
            </div>
          ) : null}
          <div>
            <p className="text-xs text-muted-foreground">{t('webhookUrl')}</p>
            <p className="font-mono text-sm break-all">{settings.webhookUrl}</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
