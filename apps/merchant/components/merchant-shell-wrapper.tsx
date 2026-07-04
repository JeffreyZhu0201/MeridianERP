'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { MerchantPluginCode, MerchantSession } from '@meridian/shared';

import { MerchantShell } from '@meridian/ui';

import { AUTH_COOKIE, apiFetch, type OnboardingProfile } from '@/lib/api';

function readAuthToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${AUTH_COOKIE}=`))
    ?.split('=')[1];
}

export function MerchantShellWrapper({
  children,
  businessName: businessNameProp,
  userEmail: userEmailProp,
  userDisplayName: userDisplayNameProp,
  lowStockAlertCount,
  installedPluginCodes: installedPluginCodesProp,
}: {
  children: React.ReactNode;
  businessName?: string;
  userEmail?: string;
  userDisplayName?: string;
  lowStockAlertCount?: number;
  installedPluginCodes?: MerchantPluginCode[];
}) {
  const router = useRouter();
  const [installedPluginCodes, setInstalledPluginCodes] = useState<
    MerchantPluginCode[] | undefined
  >(installedPluginCodesProp);
  const [fetchedBusinessName, setFetchedBusinessName] = useState<string | undefined>();
  const [fetchedUser, setFetchedUser] = useState<
    Pick<MerchantSession, 'displayName' | 'email'> | undefined
  >();
  const [sessionLoaded, setSessionLoaded] = useState(
    Boolean(
      businessNameProp &&
        installedPluginCodesProp &&
        userEmailProp &&
        userDisplayNameProp,
    ),
  );

  useEffect(() => {
    const needsPlugins = !installedPluginCodesProp;
    const needsProfile = !businessNameProp;
    const needsUser = !userEmailProp || !userDisplayNameProp;

    if (installedPluginCodesProp) {
      setInstalledPluginCodes(installedPluginCodesProp);
    }

    if (!needsPlugins && !needsProfile && !needsUser) {
      setSessionLoaded(true);
      return;
    }

    const token = readAuthToken();
    if (!token) {
      if (needsPlugins) setInstalledPluginCodes([]);
      setSessionLoaded(true);
      return;
    }

    void Promise.all([
      needsPlugins
        ? apiFetch<{ codes: MerchantPluginCode[] }>(
            '/merchant/plugins/installed-codes',
            {},
            token,
          )
        : Promise.resolve(null),
      needsProfile
        ? apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token)
        : Promise.resolve(null),
      needsUser
        ? apiFetch<MerchantSession>('/merchant/auth/me', {}, token)
        : Promise.resolve(null),
    ])
      .then(([pluginsRes, profileRes, userRes]) => {
        if (pluginsRes) setInstalledPluginCodes(pluginsRes.codes);
        if (profileRes?.businessName) setFetchedBusinessName(profileRes.businessName);
        if (userRes) {
          setFetchedUser({ displayName: userRes.displayName, email: userRes.email });
        }
      })
      .catch(() => {
        if (needsPlugins) setInstalledPluginCodes([]);
      })
      .finally(() => setSessionLoaded(true));
  }, [installedPluginCodesProp, businessNameProp, userEmailProp, userDisplayNameProp]);

  const resolvedBusinessName = businessNameProp ?? fetchedBusinessName;
  const businessNameLoading = !resolvedBusinessName && !sessionLoaded;
  const resolvedUserDisplayName = userDisplayNameProp ?? fetchedUser?.displayName;
  const resolvedUserEmail = userEmailProp ?? fetchedUser?.email;
  const userLoading =
    !resolvedUserDisplayName && !resolvedUserEmail && !sessionLoaded;

  function handleLogout() {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    router.push('/login');
    router.refresh();
  }

  return (
    <MerchantShell
      businessName={resolvedBusinessName}
      businessNameLoading={businessNameLoading}
      userDisplayName={resolvedUserDisplayName}
      userEmail={resolvedUserEmail}
      userLoading={userLoading}
      lowStockAlertCount={lowStockAlertCount}
      installedPluginCodes={installedPluginCodes ?? []}
      onLogout={handleLogout}
    >
      {children}
    </MerchantShell>
  );
}
