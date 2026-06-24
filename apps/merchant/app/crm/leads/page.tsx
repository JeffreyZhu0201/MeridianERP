import { Suspense } from 'react';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  type Contact,
  type Lead,
  type OnboardingProfile,
  type PaginatedResponse,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import { LeadsTable } from './_components/leads-table';

export default async function LeadsPage() {
  const token = await getToken();
  if (!token) return null;

  const [leadsRes, contactsRes, profile] = await Promise.all([
    apiFetch<PaginatedResponse<Lead>>('/merchant/leads', {}, token).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit: 20 },
    })),
    apiFetch<PaginatedResponse<Contact>>('/merchant/contacts', {}, token).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit: 100 },
    })),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <Suspense>
          <LeadsTable leads={leadsRes.data} contacts={contactsRes.data} token={token} />
        </Suspense>
      </div>
    </MerchantShellWrapper>
  );
}
