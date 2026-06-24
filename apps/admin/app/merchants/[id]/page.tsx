import { notFound } from 'next/navigation';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type MerchantDetail } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { MerchantDetailView } from './_components/merchant-detail';

interface MerchantDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MerchantDetailPage({ params }: MerchantDetailPageProps) {
  const token = await getToken();
  if (!token) return null;

  const { id } = await params;

  let merchant: MerchantDetail;
  try {
    merchant = await apiFetch<MerchantDetail>(`/platform/merchants/${id}`, {}, token);
  } catch {
    notFound();
  }

  return (
    <AdminShellWrapper>
      <MerchantDetailView merchant={merchant} token={token} />
    </AdminShellWrapper>
  );
}
