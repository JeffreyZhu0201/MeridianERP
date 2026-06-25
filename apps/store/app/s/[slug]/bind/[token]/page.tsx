'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { BindPageFrame, Button, Skeleton } from '@meridian/ui';
import { BindType, type BindVerifyResponse } from '@meridian/shared';
import { IconCheck } from '@tabler/icons-react';

import {
  API_URL,
  AUTH_COOKIE,
  ApiError,
  apiFetch,
  storePath,
  type StoreClaimBindingResponse,
} from '@/lib/api';

type BindState = 'loading' | 'valid' | 'requires_login' | 'success' | 'error';

export default function BindPage() {
  const params = useParams<{ slug: string; token: string }>();
  const router = useRouter();
  const t = useTranslations('store');
  const { slug, token } = params;
  const [state, setState] = useState<BindState>('loading');
  const [distributorName, setDistributorName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [claiming, setClaiming] = useState(false);

  function getAuthToken(): string | undefined {
    const match = document.cookie.match(new RegExp(`(?:^|; )${AUTH_COOKIE}=([^;]*)`));
    return match?.[1];
  }

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`${API_URL}/api/v1/bindings/verify/${token}`);
        const data = (await res.json()) as BindVerifyResponse;
        if (!data.valid) {
          setState('error');
          setErrorMessage(data.error ?? t('bind.invalidLink'));
          return;
        }

        if (data.bindType === BindType.MERCHANT) {
          setState('error');
          setErrorMessage(t('bind.merchantLink'));
          return;
        }

        if (data.tenantSlug && data.tenantSlug !== slug) {
          setState('error');
          setErrorMessage(t('bind.wrongStore'));
          return;
        }

        setDistributorName(data.distributorName);

        if (data.requiresAuth && !getAuthToken()) {
          setState('requires_login');
          return;
        }

        setState('valid');
      } catch {
        setState('error');
        setErrorMessage(t('bind.verifyFailed'));
      }
    }
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-verify only when slug/token changes
  }, [slug, token]);

  async function handleClaim() {
    setClaiming(true);
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        setState('requires_login');
        return;
      }

      await apiFetch<StoreClaimBindingResponse>(
        storePath(slug, '/bindings/claim'),
        {
          method: 'POST',
          body: JSON.stringify({ token }),
        },
        { token: authToken, storeSlug: slug },
      );
      setState('success');
    } catch (err) {
      setState('error');
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err instanceof Error ? err.message : t('bind.bindingFailed'));
      }
    } finally {
      setClaiming(false);
    }
  }

  const bindPath = `/s/${slug}/bind/${token}`;

  if (state === 'loading') {
    return (
      <BindPageFrame
        title={t('bind.verifyingTitle')}
        description={t('bind.verifyingDescription')}
      >
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
        title={t('bind.bindTitle')}
        description={t('bind.bindDescription', { name: distributorName })}
      >
        <Button className="min-h-11 w-full" size="lg" onClick={handleClaim} disabled={claiming}>
          {claiming ? t('bind.binding') : t('bind.confirmBinding')}
        </Button>
      </BindPageFrame>
    );
  }

  if (state === 'requires_login') {
    return (
      <BindPageFrame
        title={t('bind.signInRequired')}
        description={t('bind.signInDescription', { name: distributorName })}
        footer={
          <>
            {t('login.noAccountPrompt')}{' '}
            <Link
              href={`/s/${slug}/register?from=${encodeURIComponent(bindPath)}`}
              className="text-primary hover:underline"
            >
              {t('login.noAccount')}
            </Link>
          </>
        }
      >
        <Link href={`/s/${slug}/login?from=${encodeURIComponent(bindPath)}`}>
          <Button className="min-h-11 w-full" size="lg">
            {t('bind.signInToComplete')}
          </Button>
        </Link>
      </BindPageFrame>
    );
  }

  if (state === 'success') {
    return (
      <BindPageFrame
        title={t('bind.successTitle')}
        description={t('bind.successDescription', { name: distributorName })}
      >
        <div className="space-y-4 text-center">
          <IconCheck className="mx-auto size-12 text-emerald-600" stroke={1.5} />
          <Button className="min-h-11 w-full" size="lg" onClick={() => router.push(`/s/${slug}`)}>
            {t('bind.continueShopping')}
          </Button>
        </div>
      </BindPageFrame>
    );
  }

  return (
    <BindPageFrame title={t('bind.errorTitle')} description={errorMessage}>
      <p className="text-center text-sm text-muted-foreground">{t('bind.contactDistributor')}</p>
    </BindPageFrame>
  );
}
