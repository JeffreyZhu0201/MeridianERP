import { notFound } from 'next/navigation';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { Warehouse } from '@meridian/shared';

import { WarehouseDetail } from './_components/warehouse-detail';

interface WarehouseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function WarehouseDetailPage({ params }: WarehouseDetailPageProps) {
  const token = await getToken();
  if (!token) return null;

  const { id } = await params;

  let warehouse: Warehouse;
  try {
    warehouse = await apiFetch<Warehouse>(`/merchant/inventory/warehouses/${id}`, {}, token);
  } catch {
    notFound();
  }

  const profile = await apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(
    () => null,
  );

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <WarehouseDetail warehouse={warehouse} token={token} />
    </MerchantShellWrapper>
  );
}
