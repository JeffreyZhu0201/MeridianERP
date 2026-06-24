import { notFound } from 'next/navigation';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { PurchaseOrderWithDetails } from '@meridian/shared';

import { PurchaseOrderDetail } from '../_components/purchase-order-detail';

interface PurchaseOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseOrderDetailPage({ params }: PurchaseOrderDetailPageProps) {
  const token = await getToken();
  if (!token) return null;

  const { id } = await params;

  let purchaseOrder: PurchaseOrderWithDetails;
  try {
    purchaseOrder = await apiFetch<PurchaseOrderWithDetails>(
      `/merchant/inventory/purchase-orders/${id}`,
      {},
      token,
    );
  } catch {
    notFound();
  }

  const profile = await apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(
    () => null,
  );

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <PurchaseOrderDetail purchaseOrder={purchaseOrder} token={token} />
    </MerchantShellWrapper>
  );
}
