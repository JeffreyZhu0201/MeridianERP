import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ListPageFrame } from '@meridian/ui/server';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import type { BranchPurchaseOrderDetail } from '@meridian/shared';

import { ProcurementOrderDetail } from '../_components/procurement-order-detail';

interface ProcurementDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProcurementDetailPage({ params }: ProcurementDetailPageProps) {
  const token = await getToken();
  if (!token) return null;

  const { id } = await params;
  const [order, profile] = await Promise.all([
    apiFetch<BranchPurchaseOrderDetail>(`/merchant/procurement/orders/${id}`, {}, token).catch(
      () => null,
    ),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  if (!order) notFound();

  const t = await getTranslations('merchant.inventory.procurement');

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame
        title={t('detailTitle')}
        action={
          <Link
            href="/inventory/procurement/history"
            className="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
          >
            {t('historyTitle')}
          </Link>
        }
      >
        <ProcurementOrderDetail order={order} token={token} />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
