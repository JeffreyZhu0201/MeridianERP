'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { AuthLayout, AuthToolbar, Button, Input, Label } from '@meridian/ui';

import type { InviteCodePreview } from '@meridian/shared';

import { API_URL, AUTH_COOKIE, apiFetch } from '@/lib/api';

function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)store_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function OpenShopWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('store');
  const inviteCode = useMemo(
    () => searchParams.get('invite')?.trim().toUpperCase() || '',
    [searchParams],
  );
  const fromPath = inviteCode ? `/open-shop?invite=${inviteCode}` : '/open-shop';

  const [invitePreview, setInvitePreview] = useState<InviteCodePreview | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setToken(getTokenFromCookie());
  }, []);

  useEffect(() => {
    if (!inviteCode) {
      setInviteError(t('openShop.missingInvite'));
      setLoadingInvite(false);
      return;
    }
    let cancelled = false;
    async function loadInvite() {
      setLoadingInvite(true);
      try {
        const preview = await apiFetch<InviteCodePreview>(
          `/store/merchant-applications/invite/${encodeURIComponent(inviteCode)}`,
        );
        if (!cancelled) {
          setInvitePreview(preview);
          setInviteError('');
        }
      } catch {
        if (!cancelled) {
          setInviteError(t('openShop.invalidInvite'));
        }
      } finally {
        if (!cancelled) setLoadingInvite(false);
      }
    }
    void loadInvite();
    return () => {
      cancelled = true;
    };
  }, [inviteCode, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !inviteCode) return;
    if (!termsAccepted) {
      setError(t('openShop.termsRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/store/merchant-applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inviteCode,
          businessName,
          legalName: legalName || undefined,
          contactPhone: contactPhone || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? t('openShop.submitFailed'));
      }
      router.push('/open-shop/pending');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('openShop.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInvite) {
    return (
      <AuthLayout subtitle={t('openShop.subtitle')}>
        <p className="text-sm text-muted-foreground">{t('openShop.loading')}</p>
      </AuthLayout>
    );
  }

  if (inviteError || !invitePreview) {
    return (
      <AuthLayout subtitle={t('openShop.subtitle')}>
        <p className="text-sm text-destructive">{inviteError || t('openShop.invalidInvite')}</p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          {t('openShop.backHome')}
        </Link>
      </AuthLayout>
    );
  }

  if (!token) {
    const loginHref = `/login?from=${encodeURIComponent(fromPath)}`;
    const registerHref = `/register?from=${encodeURIComponent(fromPath)}`;
    return (
      <AuthLayout subtitle={t('openShop.subtitle')}>
        <p className="text-sm text-muted-foreground">
          {t('openShop.invitedBy', { name: invitePreview.promoterName })}
        </p>
        <p className="mt-4 text-sm">{t('openShop.signInRequired')}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={loginHref}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            {t('login.submit')}
          </Link>
          <Link
            href={registerHref}
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
          >
            {t('register.submit')}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout subtitle={t('openShop.subtitle')}>
      <p className="mb-4 text-sm text-muted-foreground">
        {t('openShop.invitedBy', { name: invitePreview.promoterName })}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">{t('openShop.businessName')}</Label>
          <Input
            id="businessName"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="legalName">{t('openShop.legalName')}</Label>
          <Input
            id="legalName"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">{t('openShop.contactPhone')}</Label>
          <Input
            id="contactPhone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1"
          />
          {t('openShop.terms')}
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? t('openShop.submitting') : t('openShop.submit')}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default function OpenShopPage() {
  return (
    <>
      <AuthToolbar portal="store" />
      <Suspense>
        <OpenShopWizard />
      </Suspense>
    </>
  );
}
