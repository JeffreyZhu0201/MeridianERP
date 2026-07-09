import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui/server';
import type { DistributorInviteCodeRow } from '@meridian/shared';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { SharePanel } from './_components/share-panel';

export default async function SharePage() {
  const t = await getTranslations('distributor.share');
  const token = await getToken();
  if (!token) return null;

  let codes: DistributorInviteCodeRow[] = [];
  try {
    codes = await apiFetch<DistributorInviteCodeRow[]>(
      '/distributor/me/invite-codes',
      {},
      token,
    );
  } catch {
    codes = [];
  }

  return (
    <ListPageFrame title={t('title')} description={t('pageDescription')}>
      <SharePanel initialCodes={codes} token={token} />
    </ListPageFrame>
  );
}
