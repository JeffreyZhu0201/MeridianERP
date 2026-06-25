'use client';

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

import { API_URL, type Distributor } from '@/lib/api';

interface PortalAccessCardProps {
  distributor: Distributor;
  token: string;
  isOwner: boolean;
}

export function PortalAccessCard({ distributor, token, isOwner }: PortalAccessCardProps) {
  const t = useTranslations('merchant.distributors.portal');
  const tCommon = useTranslations('common');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [portalEnabled, setPortalEnabled] = useState(distributor.portalEnabled ?? false);

  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('ownerOnly')}</p>
        </CardHeader>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/api/v1/merchant/distributors/${distributor.id}/portal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? t('updateFailed'));
      }

      setPortalEnabled(true);
      setPassword('');
      setSuccess(portalEnabled ? t('passwordReset') : t('portalEnabled'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('requestFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{t('title')}</CardTitle>
          <Badge variant={portalEnabled ? 'success' : 'secondary'}>
            {portalEnabled ? t('enabled') : t('disabled')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </CardHeader>
      <CardContent>
        {!distributor.email ? (
          <p className="text-sm text-muted-foreground">{t('noEmail')}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('loginEmail')}{' '}
              <span className="font-medium text-foreground">{distributor.email}</span>
              {distributor.lastLoginAt ? (
                <>
                  {' '}
                  · {t('lastLogin', { date: new Date(distributor.lastLoginAt).toLocaleString() })}
                </>
              ) : null}
            </p>
            <div className="space-y-2">
              <Label htmlFor="portal-password">
                {portalEnabled ? t('newPassword') : t('portalPassword')}
              </Label>
              <Input
                id="portal-password"
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('minPassword')}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
            <Button type="submit" disabled={loading}>
              {loading
                ? tCommon('saving')
                : portalEnabled
                  ? t('resetPassword')
                  : t('enablePortal')}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
