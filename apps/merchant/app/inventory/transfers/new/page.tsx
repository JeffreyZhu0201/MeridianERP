import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  type OnboardingProfile,
  type Product,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { Warehouse } from '@meridian/shared';

import { TransferForm } from '../_components/transfer-form';
import { productsToPoVariantOptions } from '@/lib/product-variants';

interface NewTransferPageProps {
  searchParams: Promise<{ variantId?: string }>;
}

/** 商户端 — 新建库存调拨 */
export default async function NewTransferPage({ searchParams }: NewTransferPageProps) {
  const token = await getToken();
  if (!token) return null;

  const { variantId } = await searchParams;

  const [warehouses, productsRes, profile] = await Promise.all([
    apiFetch<Warehouse[]>('/merchant/inventory/warehouses', {}, token).catch(() => []),
    apiFetch<Product[]>('/merchant/products?limit=500', {}, token).catch(() => []),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <TransferForm
        warehouses={warehouses}
        variants={productsToPoVariantOptions(productsRes)}
        token={token}
        prefillVariantId={variantId}
      />
    </MerchantShellWrapper>
  );
}
