'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Button,
  Input,
  Label,
  Sheet,
  SheetFooter,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';

import { apiFetch, type Company } from '@/lib/api';

interface CompaniesTableProps {
  companies: Company[];
  token: string;
}

export function CompaniesTable({ companies: initial, token }: CompaniesTableProps) {
  const router = useRouter();
  const [companies] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: '', website: '' });
  const [error, setError] = useState('');

  function openCreate() {
    setEditing(null);
    setForm({ name: '', website: '' });
    setOpen(true);
  }

  function openEdit(company: Company) {
    setEditing(company);
    setForm({ name: company.name, website: company.website ?? '' });
    setOpen(true);
  }

  async function handleSave() {
    setError('');
    try {
      if (editing) {
        await apiFetch(
          `/merchant/companies/${editing.id}`,
          { method: 'PATCH', body: JSON.stringify(form) },
          token,
        );
      } else {
        await apiFetch('/merchant/companies', { method: 'POST', body: JSON.stringify(form) }, token);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this company?')) return;
    await apiFetch(`/merchant/companies/${id}`, { method: 'DELETE' }, token);
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>Add Company</Button>
      </div>

      {companies.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No companies yet</p>
          <Button className="mt-4" onClick={openCreate}>
            Add your first company
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.website ?? '—'}</TableCell>
                  <TableCell>{company._count?.contacts ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(company)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(company.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'Edit Company' : 'Add Company'}
        footer={
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </SheetFooter>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </Sheet>
    </>
  );
}
