import { notFound } from 'next/navigation';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch } from '@/lib/api';
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
  try {
    company = await apiFetch<Company>(`/merchant/companies/${id}`, {}, token);
  } catch {
    notFound();
  }

  return (
    <MerchantShellWrapper>
      <CompanyDetail company={company} token={token} />
    </MerchantShellWrapper>
  );
}
