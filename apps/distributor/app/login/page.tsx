'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import { AuthLayout, AuthToolbar, Button, Input, Label } from '@meridian/ui';

import { API_URL, AUTH_COOKIE, type DistributorLoginResponse } from '@/lib/api';

function LoginForm() {
  const t = useTranslations('distributor.login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/distributor/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          ...(tenantSlug.trim() ? { tenantSlug: tenantSlug.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? t('invalidCredentials'));
      }

      const data = (await res.json()) as DistributorLoginResponse;
      document.cookie = `${AUTH_COOKIE}=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      const from = searchParams.get('from') ?? '/';
      router.push(from);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('signInFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthToolbar portal="distributor" />
      <AuthLayout subtitle={t('subtitle')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenantSlug">{t('tenantSlug')}</Label>
            <Input
              id="tenantSlug"
              name="tenantSlug"
              type="text"
              autoComplete="organization"
              placeholder={t('tenantSlugPlaceholder')}
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t('tenantSlugHint')}</p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('signingIn') : t('submit')}
          </Button>
        </form>
      </AuthLayout>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
