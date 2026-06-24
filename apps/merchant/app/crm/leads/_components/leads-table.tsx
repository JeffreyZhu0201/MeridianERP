'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  Sheet,
  SheetFooter,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import { LeadStage } from '@meridian/shared';

import { apiFetch, type Contact, type Lead } from '@/lib/api';

const stageVariant: Record<string, 'default' | 'warning' | 'success' | 'destructive'> = {
  [LeadStage.NEW]: 'default',
  [LeadStage.QUALIFIED]: 'warning',
  [LeadStage.WON]: 'success',
  [LeadStage.LOST]: 'destructive',
};

interface LeadsTableProps {
  leads: Lead[];
  contacts: Contact[];
  token: string;
}

export function LeadsTable({ leads: initial, contacts, token }: LeadsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stageFilter = searchParams.get('stage') ?? '';
  const [leads] = useState(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', contactId: '', source: '' });
  const [error, setError] = useState('');

  const filtered = stageFilter ? leads.filter((l) => l.stage === stageFilter) : leads;

  function updateStageFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('stage', value);
    else params.delete('stage');
    router.push(`/crm/leads?${params.toString()}`);
  }

  async function handleSave() {
    setError('');
    try {
      await apiFetch(
        '/merchant/leads',
        {
          method: 'POST',
          body: JSON.stringify({
            title: form.title,
            contactId: form.contactId || undefined,
            source: form.source || undefined,
          }),
        },
        token,
      );
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function updateStage(id: string, stage: string) {
    await apiFetch(`/merchant/leads/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    }, token);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Label htmlFor="stage-filter">Stage</Label>
          <Select
            id="stage-filter"
            value={stageFilter}
            onChange={(e) => updateStageFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value={LeadStage.NEW}>New</option>
            <option value={LeadStage.QUALIFIED}>Qualified</option>
            <option value={LeadStage.WON}>Won</option>
            <option value={LeadStage.LOST}>Lost</option>
          </Select>
        </div>
        <Button onClick={() => setOpen(true)}>Add Lead</Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          No leads yet
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Distributor</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Stage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.title}</TableCell>
                  <TableCell>
                    <Badge variant={stageVariant[lead.stage] ?? 'secondary'}>{lead.stage}</Badge>
                  </TableCell>
                  <TableCell>{lead.source ?? '—'}</TableCell>
                  <TableCell>
                    {lead.contact
                      ? `${lead.contact.firstName} ${lead.contact.lastName}`
                      : '—'}
                  </TableCell>
                  <TableCell>{lead.distributor?.name ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(lead.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Select
                      value={lead.stage}
                      onChange={(e) => updateStage(lead.id, e.target.value)}
                      className="w-32"
                    >
                      {Object.values(LeadStage).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
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
        title="Add Lead"
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
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactId">Contact</Label>
            <Select
              id="contactId"
              value={form.contactId}
              onChange={(e) => setForm({ ...form, contactId: e.target.value })}
            >
              <option value="">None</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </Sheet>
    </>
  );
}
