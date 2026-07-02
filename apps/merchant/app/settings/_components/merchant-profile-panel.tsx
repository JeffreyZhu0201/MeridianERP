'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@meridian/ui';
import type { MerchantSettingsDto } from '@meridian/shared';

import { apiFetch } from '@/lib/api';
import { SaveStatus } from './save-status';

interface MerchantProfilePanelProps {
  profile: MerchantSettingsDto['profile'];
  isOwner: boolean;
  token: string;
}

export function MerchantProfilePanel({ profile, isOwner, token }: MerchantProfilePanelProps) {
  const router = useRouter();
  const t = useTranslations('merchant.settings');
  const tCommon = useTranslations('common');

  const [businessName, setBusinessName] = useState(profile.businessName);
  const [contactEmail, setContactEmail] = useState(profile.contactEmail);
  const [contactPhone, setContactPhone] = useState(profile.contactPhone ?? '');
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
          body: JSON.stringify({ businessName, contactEmail, contactPhone: contactPhone || undefined }),
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
        <CardTitle>{t('profile')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business-name">{t('businessName')}</Label>
            <Input
              id="business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={!isOwner}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">{t('contactEmail')}</Label>
            <Input
              id="contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              disabled={!isOwner}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">{t('contactPhone')}</Label>
            <Input
              id="contact-phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              disabled={!isOwner}
            />
          </div>
          {!isOwner ? <p className="text-xs text-muted-foreground">{t('ownerOnlyHint')}</p> : null}
          <SaveStatus error={error} saved={saved} savedLabel={tCommon('saved')} />
          {isOwner ? (
            <Button type="submit" disabled={saving}>
              {saving ? tCommon('saving') : t('saveProfile')}
            </Button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
