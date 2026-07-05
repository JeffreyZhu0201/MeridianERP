'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@meridian/ui';
import type { MerchantSettingsDto } from '@meridian/shared';

import { apiFetch } from '@/lib/api';
import { SaveStatus } from './save-status';

interface NotificationSettingsPanelProps {
  settings: Pick<MerchantSettingsDto, 'notifyOnCommission'>;
  isOwner: boolean;
  token: string;
}

export function NotificationSettingsPanel({ settings, isOwner, token }: NotificationSettingsPanelProps) {
  const router = useRouter();
  const t = useTranslations('merchant.settings');
  const tCommon = useTranslations('common');

  const [notifyOnCommission, setNotifyOnCommission] = useState(settings.notifyOnCommission);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await apiFetch(
        '/merchant/settings',
        {
          method: 'PATCH',
          body: JSON.stringify({ notifyOnCommission }),
        },
        token,
      );
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('notifications')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={notifyOnCommission}
              onChange={(e) => setNotifyOnCommission(e.target.checked)}
              disabled={!isOwner}
              className="size-4 rounded border"
            />
            {t('notifyOnCommission')}
          </label>
          {!isOwner ? <p className="text-xs text-muted-foreground">{t('ownerOnlyHint')}</p> : null}
          <SaveStatus error={error} saved={saved} savedLabel={tCommon('saved')} />
          {isOwner ? (
            <Button type="submit" disabled={saving}>
              {saving ? tCommon('saving') : t('saveNotifications')}
            </Button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
