'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Button, AuthLayout, Input, Label } from '@meridian/ui';

import { API_URL } from '@/lib/api';

type Step = 1 | 2 | 3;

export function RegisterWizard() {
  const t = useTranslations('merchant.register');
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = useMemo(
    () => searchParams.get('invite')?.trim().toUpperCase() || undefined,
    [searchParams],
  );
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    legalName: '',
    contactPhone: '',
    termsAccepted: false,
  });

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateStep(): boolean {
    if (step === 1) {
      if (form.password !== form.confirmPassword) {
        setError(t('passwordsNoMatch'));
        return false;
      }
      if (form.password.length < 8) {
        setError(t('passwordMinLength'));
        return false;
      }
    }
    if (step === 3 && !form.termsAccepted) {
      setError(t('termsRequired'));
      return false;
    }
    setError('');
    return true;
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/v1/merchant/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          businessName: form.businessName,
          legalName: form.legalName || undefined,
          contactPhone: form.contactPhone || undefined,
          inviteCode,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? t('registrationFailed'));
      }

      await fetch(`${API_URL}/api/v1/merchant/onboarding/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      }).catch(() => undefined);

      router.push(`/onboarding/pending?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registrationFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout subtitle={t('subtitle', { step })}>
      <div className="space-y-6">
        {inviteCode ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {t('inviteApplied')}: <span className="font-mono">{inviteCode}</span>
          </p>
        ) : null}
        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">{t('businessName')}</Label>
              <Input
                id="businessName"
                required
                value={form.businessName}
                onChange={(e) => update('businessName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalName">{t('legalName')}</Label>
              <Input
                id="legalName"
                value={form.legalName}
                onChange={(e) => update('legalName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">{t('contactPhone')}</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={form.contactPhone}
                onChange={(e) => update('contactPhone', e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg ring-1 ring-border p-4 space-y-2">
              <p>
                <span className="text-muted-foreground">{t('reviewEmail')}</span> {form.email}
              </p>
              <p>
                <span className="text-muted-foreground">{t('reviewBusiness')}</span>{' '}
                {form.businessName}
              </p>
              <p>
                <span className="text-muted-foreground">{t('reviewLegalName')}</span>{' '}
                {form.legalName || '—'}
              </p>
              <p>
                <span className="text-muted-foreground">{t('reviewPhone')}</span>{' '}
                {form.contactPhone || '—'}
              </p>
            </div>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(e) => update('termsAccepted', e.target.checked)}
                className="mt-1"
              />
              <span>{t('termsAccept')}</span>
            </label>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex justify-between gap-2">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={() => setStep((step - 1) as Step)}>
              {t('back')}
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button
              type="button"
              onClick={() => {
                if (validateStep()) setStep((step + 1) as Step);
              }}
            >
              {t('next')}
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? t('submitting') : t('submitApplication')}
            </Button>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
