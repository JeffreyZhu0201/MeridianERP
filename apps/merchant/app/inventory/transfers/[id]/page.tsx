/*
 * @Author: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @Date: 2026-07-02 17:09:28
 * @LastEditors: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @LastEditTime: 2026-07-02 20:29:01
 * @FilePath: /MeridianERP/apps/merchant/app/inventory/transfers/[id]/page.tsx
 * @Description: 
 * 
 * Copyright (c) 2026 by JeffreyZhu, All Rights Reserved. 
 */
import { notFound } from 'next/navigation';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { StockTransferWithDetails } from '@meridian/shared';

import { TransferDetail } from './_components/transfer-detail';

interface TransferDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TransferDetailPage({ params }: TransferDetailPageProps) {
  const token = await getToken();
  if (!token) return null;

  const { id } = await params;

  let transfer: StockTransferWithDetails;
  try {
    transfer = await apiFetch<StockTransferWithDetails>(
      `/merchant/inventory/transfers/${id}`,
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
      <TransferDetail transfer={transfer} token={token} />
    </MerchantShellWrapper>
  );
}
