'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@meridian/ui';

import { apiFetch } from '@/lib/api';

interface InventorySettingsFormProps {
  defaultReorderThreshold: number;
  token: string;
}

/** 默认补货阈值表单 */
export function InventorySettingsForm({
  defaultReorderThreshold: initial,
  token,
}: InventorySettingsFormProps) {
  const router = useRouter();
  const [threshold, setThreshold] = useState(String(initial));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const t = useTranslations('merchant.inventory.settings');
  const tCommon = useTranslations('common');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      await apiFetch('/merchant/inventory/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          defaultReorderThreshold: Math.max(0, parseInt(threshold, 10) || 0),
        }),
      }, token);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{t('defaultThreshold')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-threshold">{t('defaultThreshold')}</Label>
            <Input
              id="default-threshold"
              type="number"
              min={0}
              inputMode="numeric"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="min-h-11"
            />
            <p className="text-xs text-muted-foreground">{t('defaultThresholdHelp')}</p>
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
          <Button type="submit" disabled={saving} className="min-h-11">
            {saving ? tCommon('loading') : tCommon('save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function StaffForbidden() {
  const t = useTranslations('merchant.inventory.settings');
  return (
    <div className="rounded-xl ring-1 ring-border p-12 text-center">
      <p className="text-muted-foreground">{t('forbidden')}</p>
      <Link
        href="/inventory/alerts"
        className="mt-4 inline-flex min-h-11 items-center text-sm text-primary hover:underline"
      >
        返回低库存预警
      </Link>
    </div>
  );
}
