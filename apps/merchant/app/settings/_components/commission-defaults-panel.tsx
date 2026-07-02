'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select } from '@meridian/ui';
import type { MerchantSettingsDto } from '@meridian/shared';
import { CommissionType } from '@meridian/shared';

import { apiFetch } from '@/lib/api';
import { SaveStatus } from './save-status';

interface CommissionDefaultsPanelProps {
  settings: Pick<MerchantSettingsDto, 'defaultCommissionRate' | 'defaultCommissionType'>;
  isOwner: boolean;
  token: string;
}

export function CommissionDefaultsPanel({ settings, isOwner, token }: CommissionDefaultsPanelProps) {
  const router = useRouter();
  const t = useTranslations('merchant.settings');
  const tCommon = useTranslations('common');

  const [commissionRate, setCommissionRate] = useState(
    settings.defaultCommissionRate != null ? String(settings.defaultCommissionRate) : '',
  );
  const [commissionType, setCommissionType] = useState<CommissionType>(
    settings.defaultCommissionType ?? CommissionType.PERCENT,
  );
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
          body: JSON.stringify({
            defaultCommissionRate: commissionRate === '' ? null : Number(commissionRate),
            defaultCommissionType: commissionType,
          }),
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
        <CardTitle>{t('commissionDefaults')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          <div className="space-y-2">
            <Label htmlFor="commission-rate">{t('defaultRate')}</Label>
            <Input
              id="commission-rate"
              type="number"
              min={0}
              step="0.01"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              disabled={!isOwner}
              placeholder="e.g. 10"
            />
            <p className="text-xs text-muted-foreground">{t('defaultRateHelp')}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="commission-type">{t('defaultType')}</Label>
            <Select
              id="commission-type"
              value={commissionType}
              onChange={(e) => setCommissionType(e.target.value as CommissionType)}
              disabled={!isOwner}
            >
              <option value="PERCENT">{t('commissionPercent')}</option>
              <option value="FIXED">{t('commissionFixedAmount')}</option>
            </Select>
          </div>
          {!isOwner ? <p className="text-xs text-muted-foreground">{t('ownerOnlyHint')}</p> : null}
          <SaveStatus error={error} saved={saved} savedLabel={tCommon('saved')} />
          {isOwner ? (
            <Button type="submit" disabled={saving}>
              {saving ? tCommon('saving') : t('saveDefaults')}
            </Button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
