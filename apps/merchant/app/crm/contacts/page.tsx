import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type Contact, type OnboardingProfile, type PaginatedResponse } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ContactsTable } from './_components/contacts-table';

export default async function ContactsPage() {
  const token = await getToken();
  if (!token) return null;

  const [contactsRes, profile] = await Promise.all([
    apiFetch<PaginatedResponse<Contact>>('/merchant/contacts', {}, token).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit: 20 },
    })),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <ContactsTable contacts={contactsRes.data} token={token} />
      </div>
    </MerchantShellWrapper>
  );
}
