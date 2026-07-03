import { notFound } from 'next/navigation';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch, type MerchantDetail, type PlatformDistributor } from '@/lib/api';
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
  let distributors: PlatformDistributor[] = [];
  try {
    [merchant, distributors] = await Promise.all([
      apiFetch<MerchantDetail>(`/platform/merchants/${id}`, {}, token),
      apiFetch<PlatformDistributor[]>('/platform/distributors', {}, token).catch(() => []),
    ]);
  } catch {
    notFound();
  }

  return (
    <AdminShellWithSession>
      <MerchantDetailView merchant={merchant} token={token} distributors={distributors} />
    </AdminShellWithSession>
  );
}
