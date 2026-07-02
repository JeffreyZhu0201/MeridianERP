'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogCloseButton,
  EmptyState,
  formatMoney,
  Input,
  Label,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@meridian/ui';

import {
  apiFetch,
  type AllocationOrder,
  type MasterSku,
} from '@/lib/api';

interface ApprovedMerchant {
  id: string;
  businessName: string;
  tenantId: string;
}

interface AllocationsViewProps {
  masterSkus: MasterSku[];
  allocations: AllocationOrder[];
  merchants: ApprovedMerchant[];
  token: string;
}

export function AllocationsView({
  masterSkus,
  allocations,
  merchants,
  token,
}: AllocationsViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin.allocations');
  const tc = useTranslations('common');
  const [skuOpen, setSkuOpen] = useState(false);
  const [skuEditOpen, setSkuEditOpen] = useState(false);
  const [allocOpen, setAllocOpen] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [skuCode, setSkuCode] = useState('');
  const [skuName, setSkuName] = useState('');
  const [onHand, setOnHand] = useState('0');
  const [unitCost, setUnitCost] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [retailPrice, setRetailPrice] = useState('');

  // Edit SKU state
  const [editSku, setEditSku] = useState<MasterSku | null>(null);
  const [editSkuName, setEditSkuName] = useState('');
  const [editOnHand, setEditOnHand] = useState('');
  const [editUnitCost, setEditUnitCost] = useState('');
  const [editWholesalePrice, setEditWholesalePrice] = useState('');
  const [editRetailPrice, setEditRetailPrice] = useState('');

  const [tenantId, setTenantId] = useState(merchants[0]?.tenantId ?? '');
  const [note, setNote] = useState('');
  const [lineSkuId, setLineSkuId] = useState(masterSkus[0]?.id ?? '');
  const [lineQty, setLineQty] = useState('1');
  const [lines, setLines] = useState<Array<{ masterSkuId: string; quantity: number }>>([]);

  async function handleCreateSku() {
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(
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
          }),
        },
        token,
      );
      setSkuOpen(false);
      router.refresh();
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
    setEditSku(sku);
    setEditSkuName(sku.name);
    setEditOnHand(String(sku.quantityOnHand));
    setEditUnitCost(String(sku.unitCost));
    setEditWholesalePrice(String(sku.wholesalePrice));
    setEditRetailPrice(String(sku.retailPrice));
    setSkuEditOpen(true);
  }

  async function handleUpdateSku() {
    if (!editSku) return;
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(
        `/platform/allocations/master-skus/${editSku.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: editSkuName,
            quantityOnHand: Number(editOnHand),
            unitCost: Number(editUnitCost),
            wholesalePrice: Number(editWholesalePrice),
            retailPrice: Number(editRetailPrice),
          }),
        },
        token,
      );
      setSkuEditOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('editSkuFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{t('masterSkus')}</CardTitle>
          <Button size="sm" onClick={() => setSkuOpen(true)}>
            {t('createSku')}
          </Button>
        </CardHeader>
        <CardContent>
          {masterSkus.length === 0 ? (
            <EmptyState title={t('emptySkus')} />
          ) : (
            <div className="rounded-xl ring-1 ring-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('skuColumns.code')}</TableHead>
                    <TableHead>{t('skuColumns.name')}</TableHead>
                    <TableHead className="text-right">{t('skuColumns.onHand')}</TableHead>
                    <TableHead className="text-right">{t('skuColumns.wholesale')}</TableHead>
                    <TableHead className="text-right">{t('skuColumns.retail')}</TableHead>
                    <TableHead className="text-right">{t('skuColumns.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {masterSkus.map((sku) => (
                    <TableRow key={sku.id}>
                      <TableCell className="font-mono text-xs">{sku.skuCode}</TableCell>
                      <TableCell>{sku.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{sku.quantityOnHand}</TableCell>
                      <TableCell className="text-right">{formatMoney(sku.wholesalePrice)}</TableCell>
                      <TableCell className="text-right">{formatMoney(sku.retailPrice)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openEditSku(sku)}>
                          {tc('edit')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{t('allocationOrders')}</CardTitle>
          <Button
            size="sm"
            onClick={() => setAllocOpen(true)}
            disabled={masterSkus.length === 0 || merchants.length === 0}
          >
            {t('createAllocation')}
          </Button>
        </CardHeader>
        <CardContent>
          {allocations.length === 0 ? (
            <EmptyState title={t('emptyOrders')} />
          ) : (
            <div className="rounded-xl ring-1 ring-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('orderColumns.merchant')}</TableHead>
                    <TableHead>{t('orderColumns.status')}</TableHead>
                    <TableHead className="text-right">{t('orderColumns.lines')}</TableHead>
                    <TableHead className="text-right">{t('orderColumns.total')}</TableHead>
                    <TableHead>{t('orderColumns.created')}</TableHead>
                    <TableHead className="text-right">{t('orderColumns.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((order) => {
                    const total = order.lines.reduce(
                      (sum, line) => sum + Number(line.wholesalePrice) * line.quantity,
                      0,
                    );
                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          {order.tenant?.merchantProfile?.businessName ?? order.tenantId}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{order.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{order.lines.length}</TableCell>
                        <TableCell className="text-right">{formatMoney(total)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString(locale)}
                        </TableCell>
                        <TableCell className="text-right">
                          {order.status === 'DRAFT' ? (
                            <Button size="sm" onClick={() => handleIssue(order.id)}>
                              {t('issue')}
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={skuOpen}
        onOpenChange={setSkuOpen}
        title={t('createSku')}
        footer={
          <>
            <DialogCloseButton onClose={() => setSkuOpen(false)}>{tc('cancel')}</DialogCloseButton>
            <Button onClick={handleCreateSku} disabled={submitting || !skuCode || !skuName}>
              {t('form.submitSku')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sku-code">{t('form.skuCode')}</Label>
            <Input id="sku-code" value={skuCode} onChange={(e) => setSkuCode(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku-name">{t('form.skuName')}</Label>
            <Input id="sku-name" value={skuName} onChange={(e) => setSkuName(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sku-onhand">{t('form.onHand')}</Label>
              <Input
                id="sku-onhand"
                type="number"
                min="0"
                value={onHand}
                onChange={(e) => setOnHand(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku-cost">{t('form.unitCost')}</Label>
              <Input
                id="sku-cost"
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku-wholesale">{t('form.wholesalePrice')}</Label>
              <Input
                id="sku-wholesale"
                type="number"
                min="0"
                step="0.01"
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku-retail">{t('form.retailPrice')}</Label>
              <Input
                id="sku-retail"
                type="number"
                min="0"
                step="0.01"
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={skuEditOpen}
        onOpenChange={setSkuEditOpen}
        title={t('editSku')}
        footer={
          <>
            <DialogCloseButton onClose={() => setSkuEditOpen(false)}>{tc('cancel')}</DialogCloseButton>
            <Button onClick={handleUpdateSku} disabled={submitting || !editSkuName}>
              {t('form.submitSku')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {editSku && (
            <p className="text-sm text-muted-foreground font-mono">{editSku.skuCode}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-sku-name">{t('form.skuName')}</Label>
            <Input
              id="edit-sku-name"
              value={editSkuName}
              onChange={(e) => setEditSkuName(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-sku-onhand">{t('form.onHand')}</Label>
              <Input
                id="edit-sku-onhand"
                type="number"
                min="0"
                value={editOnHand}
                onChange={(e) => setEditOnHand(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sku-cost">{t('form.unitCost')}</Label>
              <Input
                id="edit-sku-cost"
                type="number"
                min="0"
                step="0.01"
                value={editUnitCost}
                onChange={(e) => setEditUnitCost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sku-wholesale">{t('form.wholesalePrice')}</Label>
              <Input
                id="edit-sku-wholesale"
                type="number"
                min="0"
                step="0.01"
                value={editWholesalePrice}
                onChange={(e) => setEditWholesalePrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sku-retail">{t('form.retailPrice')}</Label>
              <Input
                id="edit-sku-retail"
                type="number"
                min="0"
                step="0.01"
                value={editRetailPrice}
                onChange={(e) => setEditRetailPrice(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={allocOpen}
        onOpenChange={setAllocOpen}
        title={t('createAllocation')}
        footer={
          <>
            <DialogCloseButton onClose={() => setAllocOpen(false)}>{tc('cancel')}</DialogCloseButton>
            <Button
              onClick={handleCreateAllocation}
              disabled={submitting || !tenantId || lines.length === 0}
            >
              {t('form.submitAllocation')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alloc-merchant">{t('form.merchant')}</Label>
            <Select
              id="alloc-merchant"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            >
              {merchants.map((m) => (
                <option key={m.tenantId} value={m.tenantId!}>
                  {m.businessName}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="alloc-note">{t('form.note')}</Label>
            <Textarea id="alloc-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="alloc-sku">{t('form.sku')}</Label>
              <Select
                id="alloc-sku"
                value={lineSkuId}
                onChange={(e) => setLineSkuId(e.target.value)}
              >
                {masterSkus.map((sku) => (
                  <option key={sku.id} value={sku.id}>
                    {sku.skuCode} — {sku.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alloc-qty">{t('form.quantity')}</Label>
              <Input
                id="alloc-qty"
                type="number"
                min="1"
                value={lineQty}
                onChange={(e) => setLineQty(e.target.value)}
              />
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
            {t('form.addLine')}
          </Button>
          {lines.length > 0 ? (
            <ul className="text-sm text-muted-foreground space-y-1">
              {lines.map((line, i) => {
                const sku = masterSkus.find((s) => s.id === line.masterSkuId);
                return (
                  <li key={i}>
                    {sku?.skuCode ?? line.masterSkuId} × {line.quantity}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </Dialog>
    </div>
  );
}
