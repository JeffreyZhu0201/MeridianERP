import { notFound } from 'next/navigation';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import {
  apiFetch,
  type DistributorBranch,
  type PlatformDistributor,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import { DistributorDetailView } from './_components/distributor-detail';

interface DistributorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DistributorDetailPage({ params }: DistributorDetailPageProps) {
  const token = await getToken();
  if (!token) return null;

  const { id } = await params;

  let distributor: PlatformDistributor | undefined;
  let branches: DistributorBranch[] = [];
  try {
    const [list, branchList] = await Promise.all([
      apiFetch<PlatformDistributor[]>('/platform/distributors', {}, token),
      apiFetch<DistributorBranch[]>(`/platform/distributors/${id}/branches`, {}, token),
    ]);
    distributor = list.find((d) => d.id === id);
    branches = branchList;
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
