'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { AuthLayout, AuthToolbar, Button, Input, Label } from '@meridian/ui';
import type { InviteCodePreview, StoreCustomerProfile } from '@meridian/shared';

import { API_URL, apiFetch } from '@/lib/api';

function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)store_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function formatDisplayName(profile: StoreCustomerProfile): string {
  const parts = [profile.firstName, profile.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '—';
}

function OpenShopWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('store');
  const urlInviteCode = useMemo(
    () => searchParams.get('invite')?.trim().toUpperCase() || '',
    [searchParams],
  );
  const fromPath = urlInviteCode ? `/open-shop?invite=${urlInviteCode}` : '/open-shop';

  const [invitePreview, setInvitePreview] = useState<InviteCodePreview | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(Boolean(urlInviteCode));
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<StoreCustomerProfile | null>(null);
  const [manualInviteCode, setManualInviteCode] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resolvedInviteCode = urlInviteCode || manualInviteCode.trim().toUpperCase();
  const subtitle = urlInviteCode ? t('openShop.subtitle') : t('openShop.directApplySubtitle');

  useEffect(() => {
    setToken(getTokenFromCookie());
  }, []);

  useEffect(() => {
    if (!token) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    void apiFetch<StoreCustomerProfile>('/store/auth/me', {}, token)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!urlInviteCode) {
      setInvitePreview(null);
      setInviteError('');
      setLoadingInvite(false);
      return;
    }
    let cancelled = false;
    async function loadInvite() {
      setLoadingInvite(true);
      try {
        const preview = await apiFetch<InviteCodePreview>(
          `/store/merchant-applications/invite/${encodeURIComponent(urlInviteCode)}`,
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
  }, [urlInviteCode, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!termsAccepted) {
      setError(t('openShop.termsRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const body: Record<string, string | undefined> = {
        businessName,
        legalName: legalName || undefined,
        contactPhone: contactPhone || undefined,
      };
      if (resolvedInviteCode) {
        body.inviteCode = resolvedInviteCode;
      }

      const res = await fetch(`${API_URL}/api/v1/store/merchant-applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const responseBody = await res.json().catch(() => ({}));
        throw new Error(responseBody.message ?? t('openShop.submitFailed'));
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
      <AuthLayout subtitle={subtitle}>
        <p className="text-sm text-muted-foreground">{t('openShop.loading')}</p>
      </AuthLayout>
    );
  }

  if (urlInviteCode && (inviteError || !invitePreview)) {
    return (
      <AuthLayout subtitle={subtitle}>
        <p className="text-sm text-destructive">{inviteError || t('openShop.invalidInvite')}</p>
        <Link href="/shop" className="mt-4 inline-block text-sm text-primary hover:underline">
          {t('openShop.backHome')}
        </Link>
      </AuthLayout>
    );
  }

  if (!token) {
    const loginHref = `/login?from=${encodeURIComponent(fromPath)}`;
    const registerHref = `/register?from=${encodeURIComponent(fromPath)}`;
    return (
      <AuthLayout subtitle={subtitle}>
        {invitePreview ? (
          <p className="text-sm text-muted-foreground">
            {t('openShop.invitedBy', { name: invitePreview.promoterName })}
          </p>
        ) : null}
        <p className={`text-sm ${invitePreview ? 'mt-4' : ''}`}>{t('openShop.signInRequired')}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href={loginHref}>{t('login.submit')}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={registerHref}>{t('register.submit')}</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout subtitle={subtitle}>
      {invitePreview ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {t('openShop.invitedBy', { name: invitePreview.promoterName })}
        </p>
      ) : null}

      {profile ? (
        <div className="mb-6 space-y-3 rounded-lg border border-neutral-300 bg-muted/40 p-4 dark:border-neutral-600">
          <p className="text-sm font-medium">{t('openShop.userInfo')}</p>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t('login.email')}</dt>
              <dd className="font-medium">{profile.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t('register.firstName')}</dt>
              <dd className="font-medium">{formatDisplayName(profile)}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {urlInviteCode ? (
          <div className="space-y-2">
            <Label htmlFor="inviteCode">{t('openShop.inviteCodeReadonly')}</Label>
            <Input id="inviteCode" value={urlInviteCode} readOnly className="bg-muted" />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="inviteCode">{t('openShop.inviteCodeOptional')}</Label>
            <Input
              id="inviteCode"
              value={manualInviteCode}
              onChange={(e) => setManualInviteCode(e.target.value.toUpperCase())}
              placeholder={t('openShop.inviteCodeHint')}
              maxLength={12}
            />
          </div>
        )}
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
