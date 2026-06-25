import { notFound } from 'next/navigation';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type DistributorBranch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { DistributorDetailView } from './_components/distributor-detail';

export interface DistributorDetailResponse {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  commissionRate: number;
  commissionType: string;
  isActive: boolean;
  portalEnabled: boolean;
  recruitedMerchantCount: number;
  createdAt: string;
  inviteCodes: Array<{
    id: string;
    code: string;
    expiresAt: string | null;
    revokedAt: string | null;
    useCount: number;
    url: string;
  }>;
}

interface DistributorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DistributorDetailPage({ params }: DistributorDetailPageProps) {
  const token = await getToken();
  if (!token) return null;

  const { id } = await params;

  let distributor: DistributorDetailResponse | undefined;
  let branches: DistributorBranch[] = [];
  try {
    [distributor, branches] = await Promise.all([
      apiFetch<DistributorDetailResponse>(`/platform/distributors/${id}`, {}, token),
      apiFetch<DistributorBranch[]>(`/platform/distributors/${id}/branches`, {}, token),
    ]);
  } catch {
    distributor = undefined;
  }

  if (!distributor) {
    notFound();
  }

  return (
    <AdminShellWrapper>
      <DistributorDetailView distributor={distributor} branches={branches} token={token} />
    </AdminShellWrapper>
  );
}
