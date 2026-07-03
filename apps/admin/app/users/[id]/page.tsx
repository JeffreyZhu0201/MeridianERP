import { notFound } from 'next/navigation';
import { OnboardingStatus } from '@meridian/shared';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import {
  apiFetch,
  type ApprovedMerchantOption,
  type PaginatedResponse,
  type PlatformAccountDetail,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import { UserDetailView } from './_components/user-detail-view';

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const token = await getToken();
  if (!token) return null;

  const { id } = await params;

  let user: PlatformAccountDetail;
  let approvedMerchants: ApprovedMerchantOption[] = [];
  try {
    const [userRes, merchantsRes] = await Promise.all([
      apiFetch<PlatformAccountDetail>(`/platform/users/${id}`, {}, token),
      apiFetch<PaginatedResponse<ApprovedMerchantOption>>(
        `/platform/merchants?status=${OnboardingStatus.APPROVED}&limit=100`,
        {},
        token,
      ).catch(() => ({ data: [], meta: { total: 0, page: 1, limit: 100 } })),
    ]);
    user = userRes;
    approvedMerchants = merchantsRes.data.map((merchant) => ({
      id: merchant.id,
      tenantId: merchant.tenantId,
      businessName: merchant.businessName,
    }));
  } catch {
    notFound();
  }

  return (
    <AdminShellWrapper>
      <UserDetailView user={user} token={token} approvedMerchants={approvedMerchants} />
    </AdminShellWrapper>
  );
}
