'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AuthLayout, Button, Input, Label } from '@meridian/ui';

import {
  ADMIN_ROLE_COOKIE,
  API_URL,
  AUTH_COOKIE,
  type AuthResponse,
} from '@/lib/api';
import { ADMIN_ROLE_HOME_PATH, adminCanAccessPath, type AdminPlatformRole } from '@meridian/shared';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('admin.login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/platform/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? t('invalid'));
      }

      const data = (await res.json()) as AuthResponse;
      const role = data.user.role;
      const cookieOpts = `path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      document.cookie = `${AUTH_COOKIE}=${data.accessToken}; ${cookieOpts}`;
      document.cookie = `${ADMIN_ROLE_COOKIE}=${role}; ${cookieOpts}`;
      const homePath =
        data.homePath ?? ADMIN_ROLE_HOME_PATH[role as AdminPlatformRole] ?? '/';
      const from = searchParams.get('from');
      const destination =
        from && adminCanAccessPath(role, from) ? from : homePath;
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout subtitle={t('subtitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold tracking-tight">{t('title')}</h1>
        </div>
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
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('submitting') : t('submit')}
        </Button>
      </form>
    </AuthLayout>
  );
}
