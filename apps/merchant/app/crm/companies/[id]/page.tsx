import { notFound } from 'next/navigation';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, asList, type Contact, type PaginatedResponse } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { Company } from '@/lib/api';

import { CompanyDetail } from './_components/company-detail';

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const token = await getToken();
  if (!token) return null;

  const { id } = await params;

  let company: Company;
  let contacts: Contact[] = [];
  try {
    const [companyRes, contactsRes] = await Promise.all([
      apiFetch<Company>(`/merchant/companies/${id}`, {}, token),
      apiFetch<PaginatedResponse<Contact> | Contact[]>('/merchant/contacts', {}, token).catch(
        () => [] as Contact[],
      ),
    ]);
    company = companyRes;
    contacts = asList(contactsRes).filter((c) => c.companyId === id);
  } catch {
    notFound();
  }

  return (
    <MerchantShellWrapper>
      <CompanyDetail company={company} contacts={contacts} token={token} />
    </MerchantShellWrapper>
  );
}
