'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from '@meridian/ui';
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
  const [legalName, setLegalName] = useState(profile.legalName ?? '');
  const [storeAddress, setStoreAddress] = useState(profile.storeAddress ?? '');
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
          body: JSON.stringify({
            businessName,
            legalName: legalName.trim() || null,
            storeAddress: storeAddress.trim() || null,
            contactEmail,
            contactPhone: contactPhone || undefined,
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
        <CardTitle>{t('storeProfile')}</CardTitle>
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
              className="min-h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="legal-name">{t('legalName')}</Label>
            <Input
              id="legal-name"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              disabled={!isOwner}
              className="min-h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-address">{t('storeAddress')}</Label>
            <Textarea
              id="store-address"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              disabled={!isOwner}
              rows={2}
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
              className="min-h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">{t('contactPhone')}</Label>
            <Input
              id="contact-phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              disabled={!isOwner}
              className="min-h-11"
            />
          </div>
          {!isOwner ? <p className="text-xs text-muted-foreground">{t('ownerOnlyHint')}</p> : null}
          <SaveStatus error={error} saved={saved} savedLabel={tCommon('saved')} />
          {isOwner ? (
            <Button type="submit" disabled={saving} className="min-h-11">
              {saving ? tCommon('saving') : t('saveProfile')}
            </Button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
