'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Card, CardContent, Skeleton } from '@meridian/ui';
import { IconCheck } from '@tabler/icons-react';

import { API_URL, AUTH_COOKIE, apiFetch, type BindVerifyResponse } from '@/lib/api';

type BindState = 'loading' | 'valid' | 'requires_login' | 'success' | 'error';

export default function BindPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;
  const [state, setState] = useState<BindState>('loading');
  const [distributorName, setDistributorName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`${API_URL}/api/v1/bindings/verify/${token}`);
        const data = (await res.json()) as BindVerifyResponse;
        if (!data.valid) {
          setState('error');
          setErrorMessage(data.error ?? 'This link is invalid or has expired.');
          return;
        }
        if (data.requiresAuth) {
          setState('requires_login');
          setDistributorName(data.distributorName ?? 'distributor');
          return;
        }
        setDistributorName(data.distributorName ?? 'distributor');
        setState('valid');
      } catch {
        setState('error');
        setErrorMessage('Unable to verify this link.');
      }
    }
    verify();
  }, [token]);

  function getAuthToken(): string | undefined {
    const match = document.cookie.match(new RegExp(`(?:^|; )${AUTH_COOKIE}=([^;]*)`));
    return match?.[1];
  }

  async function handleClaim() {
    setClaiming(true);
    try {
      const authToken = getAuthToken();
      await apiFetch(
        '/bindings/claim',
        {
          method: 'POST',
          body: JSON.stringify({ token }),
        },
        authToken,
      );
      setState('success');
    } catch (err) {
      setState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Binding failed');
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 p-6 pt-6">
          {state === 'loading' ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          ) : null}

          {state === 'valid' ? (
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-xl font-semibold">Bind to distributor</h1>
                <p className="text-sm text-muted-foreground">
                  Bind to <strong>{distributorName}</strong>?
                </p>
              </div>
              <Button className="min-h-11 w-full" size="lg" onClick={handleClaim} disabled={claiming}>
                {claiming ? 'Binding…' : 'Confirm binding'}
              </Button>
            </>
          ) : null}

          {state === 'requires_login' ? (
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-xl font-semibold">Sign in required</h1>
                <p className="text-sm text-muted-foreground">
                  Sign in to complete binding with {distributorName}.
                </p>
              </div>
              <Link href={`/login?from=${encodeURIComponent(`/bind/${token}`)}`}>
                <Button className="min-h-11 w-full" size="lg">
                  Sign in to complete binding
                </Button>
              </Link>
            </>
          ) : null}

          {state === 'success' ? (
            <div className="space-y-4 text-center">
              <IconCheck className="mx-auto size-12 text-emerald-600" stroke={1.5} />
              <h1 className="text-xl font-semibold">Successfully bound</h1>
              <Button className="min-h-11 w-full" size="lg" onClick={() => router.push('/')}>
                Go to dashboard
              </Button>
            </div>
          ) : null}

          {state === 'error' ? (
            <div className="space-y-4 text-center">
              <h1 className="text-xl font-semibold text-destructive">Unable to bind</h1>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <p className="text-sm text-muted-foreground">
                Contact your distributor for a new code.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
