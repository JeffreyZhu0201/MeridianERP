'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogCloseButton,
  EmptyState,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@meridian/ui';
import type { Warehouse } from '@meridian/shared';

import { apiFetch } from '@/lib/api';
import { inventoryZh } from '@/lib/i18n/inventory-zh';

interface WarehousesTableProps {
  warehouses: Warehouse[];
  token: string;
  isOwner: boolean;
}

/** 仓库列表与新建/编辑/设默认交互 */
export function WarehousesTable({ warehouses: initial, token, isOwner }: WarehousesTableProps) {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultDialog, setDefaultDialog] = useState<Warehouse | null>(null);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState({ name: '', address: '', isActive: true });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const zh = inventoryZh.warehouses;
  const common = inventoryZh.common;

  function openCreate() {
    setEditing(null);
    setForm({ name: '', address: '', isActive: true });
    setError('');
    setDialogOpen(true);
  }

  function openEdit(warehouse: Warehouse) {
    setEditing(warehouse);
    setForm({
      name: warehouse.name,
      address: warehouse.address ?? '',
      isActive: warehouse.isActive,
    });
    setError('');
    setDialogOpen(true);
  }

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/merchant/inventory/warehouses/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: form.name,
            address: form.address || null,
            isActive: form.isActive,
          }),
        }, token);
      } else {
        await apiFetch('/merchant/inventory/warehouses', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name,
            address: form.address || undefined,
          }),
        }, token);
      }
      setDialogOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(warehouse: Warehouse) {
    try {
      await apiFetch(`/merchant/inventory/warehouses/${warehouse.id}/set-default`, {
        method: 'POST',
      }, token);
      setDefaultDialog(null);
      setWarehouses((prev) =>
        prev.map((w) => ({ ...w, isDefault: w.id === warehouse.id })),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : zh.setDefaultFailed);
    }
  }

  return (
    <>
      <div className="flex justify-end">
        {isOwner ? (
          <Button onClick={openCreate} className="min-h-11">
            {zh.add}
          </Button>
        ) : null}
      </div>

      {warehouses.length === 0 ? (
        <EmptyState
          title={zh.emptyTitle}
          description={zh.emptyDescription}
          action={
            isOwner ? (
              <Button onClick={openCreate} className="min-h-11">
                {zh.add}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{zh.name}</TableHead>
                <TableHead>{zh.address}</TableHead>
                <TableHead>{zh.defaultBadge}</TableHead>
                <TableHead>{common.status}</TableHead>
                {isOwner ? <TableHead className="text-right">{common.actions}</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium">{warehouse.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {warehouse.address ?? '—'}
                  </TableCell>
                  <TableCell>
                    {warehouse.isDefault ? (
                      <Badge variant="outline">{zh.defaultBadge}</Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={warehouse.isActive ? 'success' : 'secondary'}>
                      {warehouse.isActive ? common.active : common.inactive}
                    </Badge>
                  </TableCell>
                  {isOwner ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-9"
                          onClick={() => openEdit(warehouse)}
                        >
                          {common.edit}
                        </Button>
                        {!warehouse.isDefault ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-9"
                            onClick={() => setDefaultDialog(warehouse)}
                          >
                            {zh.setDefault}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? zh.edit : zh.add}
        footer={
          <>
            <DialogCloseButton onClick={() => setDialogOpen(false)}>{common.cancel}</DialogCloseButton>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? common.loading : common.save}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wh-name">{zh.name}</Label>
            <Input
              id="wh-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={100}
              required
              className="min-h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wh-address">{zh.address}</Label>
            <Textarea
              id="wh-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          {editing ? (
            <label className="flex flex-wrap items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="size-4 rounded border-input"
              />
              {common.active}
              {editing.isDefault && !form.isActive ? (
                <span className="text-xs text-amber-600">{zh.deactivateWarning}</span>
              ) : null}
            </label>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        open={!!defaultDialog}
        onOpenChange={(open) => !open && setDefaultDialog(null)}
        title={zh.setDefaultTitle}
        description={
          defaultDialog ? zh.setDefaultDescription(defaultDialog.name) : undefined
        }
        footer={
          <>
            <DialogCloseButton onClick={() => setDefaultDialog(null)}>{common.cancel}</DialogCloseButton>
            <Button onClick={() => defaultDialog && handleSetDefault(defaultDialog)}>
              {common.confirm}
            </Button>
          </>
        }
      />
    </>
  );
}
