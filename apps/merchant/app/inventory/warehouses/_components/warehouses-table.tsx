'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogCloseButton,
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

interface WarehousesTableProps {
  warehouses: Warehouse[];
  token: string;
  isOwner: boolean;
}

export function WarehousesTable({ warehouses: initial, token, isOwner }: WarehousesTableProps) {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultDialog, setDefaultDialog] = useState<Warehouse | null>(null);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState({ name: '', address: '', isActive: true });
  const [error, setError] = useState('');

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
      setError(err instanceof Error ? err.message : 'Save failed');
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
      setError(err instanceof Error ? err.message : 'Failed to set default');
    }
  }

  return (
    <>
      <div className="flex justify-end">
        {isOwner ? <Button onClick={openCreate}>Add warehouse</Button> : null}
      </div>

      {warehouses.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          No warehouses yet
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Status</TableHead>
                {isOwner ? <TableHead className="text-right">Actions</TableHead> : null}
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
                      <Badge variant="outline">Default</Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={warehouse.isActive ? 'success' : 'secondary'}>
                      {warehouse.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {isOwner ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(warehouse)}>
                          Edit
                        </Button>
                        {!warehouse.isDefault ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDefaultDialog(warehouse)}
                          >
                            Set default
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
        title={editing ? 'Edit warehouse' : 'Add warehouse'}
        footer={
          <>
            <DialogCloseButton onClick={() => setDialogOpen(false)} />
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wh-name">Name</Label>
            <Input
              id="wh-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wh-address">Address</Label>
            <Textarea
              id="wh-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          {editing ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="size-4 rounded border-input"
              />
              Active
              {editing.isDefault && !form.isActive ? (
                <span className="text-xs text-amber-600">Warning: deactivating default warehouse</span>
              ) : null}
            </label>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </Dialog>

      <Dialog
        open={!!defaultDialog}
        onOpenChange={(open) => !open && setDefaultDialog(null)}
        title="Set default warehouse"
        description={
          defaultDialog
            ? `Set ${defaultDialog.name} as the default fulfillment warehouse?`
            : undefined
        }
        footer={
          <>
            <DialogCloseButton onClick={() => setDefaultDialog(null)} />
            <Button onClick={() => defaultDialog && handleSetDefault(defaultDialog)}>
              Confirm
            </Button>
          </>
        }
      />
    </>
  );
}
