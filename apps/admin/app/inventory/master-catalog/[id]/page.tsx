import { notFound } from 'next/navigation';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type MasterSku } from '@/lib/api';
import { getToken } from '@/lib/auth';

import { MasterSkuEditor } from './_components/master-sku-editor';

interface MasterSkuEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function MasterSkuEditorPage({ params }: MasterSkuEditorPageProps) {
  const { id } = await params;
  const token = await getToken();
  if (!token) return null;

  const sku = await apiFetch<MasterSku>(
    `/platform/allocations/master-skus/${id}`,
    {},
    token,
  ).catch(() => null);

  if (!sku) {
    notFound();
  }

  return (
    <AdminShellWrapper>
      <MasterSkuEditor sku={sku} token={token} />
    </AdminShellWrapper>
  );
}
