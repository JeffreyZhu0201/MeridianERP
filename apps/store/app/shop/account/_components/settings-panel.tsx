'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { StoreCustomerProfile } from '@meridian/shared';
import { StoreAccountSettingsForm } from '@meridian/ui';
import { ApiError } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

export function SettingsPanel({
  profile,
  token,
}: {
  profile: StoreCustomerProfile;
  token: string;
}) {
  const router = useRouter();
  const t = useTranslations('store.account.settings');

  return (
    <StoreAccountSettingsForm
      profile={profile}
      labels={{
        profileTitle: t('profileTitle'),
        firstName: t('firstName'),
        lastName: t('lastName'),
        phone: t('phone'),
        email: t('email'),
        saveProfile: t('saveProfile'),
        passwordTitle: t('passwordTitle'),
        currentPassword: t('currentPassword'),
        newPassword: t('newPassword'),
        changePassword: t('changePassword'),
        successProfile: t('successProfile'),
        successPassword: t('successPassword'),
        error: t('error'),
      }}
      onSaveProfile={async (body) => {
        await apiFetch<StoreCustomerProfile>(
          '/store/auth/me',
          { method: 'PATCH', body: JSON.stringify(body) },
          token,
        );
        router.refresh();
      }}
      onChangePassword={async (body) => {
        try {
          await apiFetch(
            '/store/auth/change-password',
            { method: 'POST', body: JSON.stringify(body) },
            token,
          );
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            throw error;
          }
          throw error;
        }
        router.refresh();
      }}
    />
  );
}
