import { notFound } from 'next/navigation';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { Lead } from '@/lib/api';

import { LeadDetail } from './_components/lead-detail';

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const token = await getToken();
  if (!token) return null;

  const { id } = await params;

  let lead: Lead;
  try {
    lead = await apiFetch<Lead>(`/merchant/leads/${id}`, {}, token);
  } catch {
    notFound();
  }

  return (
    <MerchantShellWrapper>
      <LeadDetail lead={lead} token={token} />
    </MerchantShellWrapper>
  );
}
