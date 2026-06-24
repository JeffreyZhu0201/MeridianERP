'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, CardContent, Input, Label } from '@meridian/ui';

import { API_URL } from '@/lib/api';

type Step = 1 | 2 | 3;

export function RegisterWizard() {
  const router = useRouter();
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
        setError('Passwords do not match');
        return false;
      }
      if (form.password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
    }
    if (step === 3 && !form.termsAccepted) {
      setError('You must accept the terms');
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
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Registration failed');
      }

      await fetch(`${API_URL}/api/v1/merchant/onboarding/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      }).catch(() => undefined);

      router.push(`/onboarding/pending?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 p-6 pt-6">
          <div className="space-y-1 text-center">
            <p className="text-xl font-semibold">MeridianERP</p>
            <h1 className="text-lg font-medium">Register your business</h1>
            <p className="text-sm text-muted-foreground">Step {step} of 3</p>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
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
                <Label htmlFor="businessName">Business name</Label>
                <Input
                  id="businessName"
                  required
                  value={form.businessName}
                  onChange={(e) => update('businessName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalName">Legal name</Label>
                <Input
                  id="legalName"
                  value={form.legalName}
                  onChange={(e) => update('legalName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact phone</Label>
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
              <div className="rounded-lg border p-4 space-y-2">
                <p>
                  <span className="text-muted-foreground">Email:</span> {form.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Business:</span> {form.businessName}
                </p>
                <p>
                  <span className="text-muted-foreground">Legal name:</span>{' '}
                  {form.legalName || '—'}
                </p>
                <p>
                  <span className="text-muted-foreground">Phone:</span>{' '}
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
                <span>I agree to the platform terms and conditions</span>
              </label>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex justify-between gap-2">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={() => setStep((step - 1) as Step)}>
                Back
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
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Application'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
