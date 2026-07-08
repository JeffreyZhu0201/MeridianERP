'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Label, Select } from '@meridian/ui';

import { apiFetch, type AllocationOrder, type MasterSku } from '@/lib/api';
import { AllocationOrdersTable } from './allocation-orders-table';
import { CreateAllocationDialog } from './create-allocation-dialog';
import { CreateSkuDialog } from './create-sku-dialog';
import { MasterSkuTable } from './master-sku-table';

interface ApprovedMerchant {
  id: string;
  businessName: string;
  tenantId: string;
}

interface AllocationsViewProps {
  masterSkus: MasterSku[];
  skuMeta: { total: number; page: number; limit: number };
  allocations: AllocationOrder[];
  merchants: ApprovedMerchant[];
  token: string;
  filterTenantId: string;
  filterStatus: string;
}

const ALLOCATION_STATUSES = ['DRAFT', 'ISSUED', 'CONFIRMED', 'CANCELLED'] as const;

export function AllocationsView({
  masterSkus,
  allocations,
  merchants,
  token,
  filterTenantId,
  filterStatus,
}: AllocationsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('admin.masterCatalog');
  const tc = useTranslations('common');
  const [skuOpen, setSkuOpen] = useState(false);
  const [allocOpen, setAllocOpen] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [skuCode, setSkuCode] = useState('');
  const [skuName, setSkuName] = useState('');
  const [onHand, setOnHand] = useState('0');
  const [unitCost, setUnitCost] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [flagshipPrice, setFlagshipPrice] = useState('');

  const [tenantId, setTenantId] = useState(merchants[0]?.tenantId ?? '');
  const [note, setNote] = useState('');
  const [lineSkuId, setLineSkuId] = useState(masterSkus[0]?.id ?? '');
  const [lineQty, setLineQty] = useState('1');
  const [lines, setLines] = useState<Array<{ masterSkuId: string; quantity: number }>>([]);

  function updateFilter(key: 'tenantId' | 'status', value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  async function handleCreateSku() {
    setSubmitting(true);
    setError('');
    try {
      const created = await apiFetch<MasterSku>(
        '/platform/allocations/master-skus',
        {
          method: 'POST',
          body: JSON.stringify({
            skuCode,
            name: skuName,
            quantityOnHand: Number(onHand),
            unitCost: Number(unitCost),
            wholesalePrice: Number(wholesalePrice),
            retailPrice: Number(retailPrice),
            flagshipPrice: Number(flagshipPrice),
          }),
        },
        token,
      );
      setSkuOpen(false);
      router.push(`/inventory/master-catalog/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createSkuFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleAddLine() {
    if (!lineSkuId || Number(lineQty) < 1) return;
    setLines((prev) => [...prev, { masterSkuId: lineSkuId, quantity: Number(lineQty) }]);
    setLineQty('1');
  }

  async function handleCreateAllocation() {
    if (!tenantId || lines.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(
        '/platform/allocations',
        {
          method: 'POST',
          body: JSON.stringify({ tenantId, note: note || undefined, lines }),
        },
        token,
      );
      setAllocOpen(false);
      setLines([]);
      setNote('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createAllocationFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleIssue(id: string) {
    setError('');
    try {
      await apiFetch(`/platform/allocations/${id}/issue`, { method: 'POST' }, token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('issueFailed'));
    }
  }

  function openEditSku(sku: MasterSku) {
    router.push(`/inventory/master-catalog/${sku.id}`);
  }

  async function handleSyncAll() {
    setError('');
    try {
      await apiFetch('/platform/flagship-catalog/sync', { method: 'POST' }, token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('syncAllFailed'));
    }
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <MasterSkuTable
        masterSkus={masterSkus}
        labels={{
          title: t('masterSkus'),
          create: t('createSku'),
          empty: t('emptySkus'),
          code: t('skuColumns.code'),
          name: t('skuColumns.name'),
          onHand: t('skuColumns.onHand'),
          wholesale: t('skuColumns.wholesale'),
          retail: t('skuColumns.retail'),
          flagship: t('skuColumns.flagship'),
          syncStatus: t('skuColumns.syncStatus'),
          synced: t('skuColumns.synced'),
          notSynced: t('skuColumns.notSynced'),
          actions: t('skuColumns.actions'),
          edit: t('content.editProduct'),
          syncAll: t('syncAll'),
        }}
        onCreate={() => setSkuOpen(true)}
        onEdit={openEditSku}
        onSyncAll={handleSyncAll}
      />

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="alloc-tenant-filter">{t('filterMerchant')}</Label>
          <Select
            id="alloc-tenant-filter"
            value={filterTenantId}
            onChange={(e) => updateFilter('tenantId', e.target.value)}
            className="min-w-[200px]"
          >
            <option value="">{t('allMerchants')}</option>
            {merchants.map((m) => (
              <option key={m.tenantId} value={m.tenantId}>
                {m.businessName}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="alloc-status-filter">{t('filterStatus')}</Label>
          <Select
            id="alloc-status-filter"
            value={filterStatus}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="w-[160px]"
          >
            <option value="">{t('allStatuses')}</option>
            {ALLOCATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`orderStatus.${status}`)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <AllocationOrdersTable
        allocations={allocations}
        canCreate={masterSkus.length > 0 && merchants.length > 0}
        locale={locale}
        labels={{
          title: t('allocationOrders'),
          create: t('createAllocation'),
          empty: t('emptyOrders'),
          merchant: t('orderColumns.merchant'),
          status: t('orderColumns.status'),
          lines: t('orderColumns.lines'),
          total: t('orderColumns.total'),
          created: t('orderColumns.created'),
          actions: t('orderColumns.actions'),
          issue: t('issue'),
          lineSku: t('orderColumns.lineSku'),
          lineQty: t('orderColumns.lineQty'),
          linePrice: t('orderColumns.linePrice'),
          expandLines: t('orderColumns.expandLines'),
          collapseLines: t('orderColumns.collapseLines'),
        }}
        onCreate={() => setAllocOpen(true)}
        onIssue={handleIssue}
      />

      <CreateSkuDialog
        open={skuOpen}
        onOpenChange={setSkuOpen}
        skuCode={skuCode}
        skuName={skuName}
        onHand={onHand}
        unitCost={unitCost}
        wholesalePrice={wholesalePrice}
        retailPrice={retailPrice}
        flagshipPrice={flagshipPrice}
        submitting={submitting}
        onSkuCodeChange={setSkuCode}
        onSkuNameChange={setSkuName}
        onOnHandChange={setOnHand}
        onUnitCostChange={setUnitCost}
        onWholesalePriceChange={setWholesalePrice}
        onRetailPriceChange={setRetailPrice}
        onFlagshipPriceChange={setFlagshipPrice}
        onSubmit={handleCreateSku}
      />

      <CreateAllocationDialog
        open={allocOpen}
        onOpenChange={setAllocOpen}
        merchants={merchants}
        masterSkus={masterSkus}
        tenantId={tenantId}
        note={note}
        lineSkuId={lineSkuId}
        lineQty={lineQty}
        lines={lines}
        submitting={submitting}
        onTenantIdChange={setTenantId}
        onNoteChange={setNote}
        onLineSkuIdChange={setLineSkuId}
        onLineQtyChange={setLineQty}
        onAddLine={handleAddLine}
        onSubmit={handleCreateAllocation}
      />
    </div>
  );
}
