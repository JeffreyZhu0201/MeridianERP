'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { BindPageFrame, Button, Skeleton } from '@meridian/ui';
import { IconCheck } from '@tabler/icons-react';

import { API_URL, AUTH_COOKIE, apiFetch, type BindVerifyResponse } from '@/lib/api';

type BindState = 'loading' | 'valid' | 'requires_login' | 'success' | 'error';

export default function BindPage() {
  const t = useTranslations('merchant.bind');
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
          setErrorMessage(data.error ?? t('invalidLink'));
          return;
        }
        if (data.requiresAuth) {
          setState('requires_login');
          setDistributorName(data.distributorName ?? t('defaultDistributor'));
          return;
        }
        setDistributorName(data.distributorName ?? t('defaultDistributor'));
        setState('valid');
      } catch {
        setState('error');
        setErrorMessage(t('verifyFailed'));
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
      setErrorMessage(err instanceof Error ? err.message : t('bindingFailed'));
    } finally {
      setClaiming(false);
    }
  }

  const bindPath = `/bind/${token}`;

  if (state === 'loading') {
    return (
      <BindPageFrame title={t('verifyingTitle')} description={t('verifyingDescription')}>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </BindPageFrame>
    );
  }

  if (state === 'valid') {
    return (
      <BindPageFrame
        title={t('bindTitle')}
        description={t('bindDescription', { name: distributorName })}
      >
        <Button className="min-h-11 w-full" size="lg" onClick={handleClaim} disabled={claiming}>
          {claiming ? t('binding') : t('confirmBinding')}
        </Button>
      </BindPageFrame>
    );
  }

  if (state === 'requires_login') {
    return (
      <BindPageFrame
        title={t('signInRequiredTitle')}
        description={t('signInRequiredDescription', { name: distributorName })}
      >
        <Link href={`/login?from=${encodeURIComponent(bindPath)}`}>
          <Button className="min-h-11 w-full" size="lg">
            {t('signInToComplete')}
          </Button>
        </Link>
      </BindPageFrame>
    );
  }

  if (state === 'success') {
    return (
      <BindPageFrame
        title={t('successTitle')}
        description={t('successDescription', { name: distributorName })}
      >
        <div className="space-y-4 text-center">
          <IconCheck className="mx-auto size-12 text-emerald-600" stroke={1.5} />
          <Button className="min-h-11 w-full" size="lg" onClick={() => router.push('/')}>
            {t('goToDashboard')}
          </Button>
        </div>
      </BindPageFrame>
    );
  }

  return (
    <BindPageFrame title={t('errorTitle')} description={errorMessage}>
      <p className="text-center text-sm text-muted-foreground">{t('contactDistributor')}</p>
    </BindPageFrame>
  );
}
