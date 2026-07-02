'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { LeadStage, type PlatformCrmContact, type PlatformCrmLead } from '@meridian/shared';
import {
  Badge,
  Button,
  Dialog,
  DialogCloseButton,
  EmptyState,
  Input,
  Label,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';

import { apiFetch } from '@/lib/api';

const stageVariant: Record<string, 'default' | 'warning' | 'success' | 'destructive'> = {
  [LeadStage.NEW]: 'default',
  [LeadStage.QUALIFIED]: 'warning',
  [LeadStage.WON]: 'success',
  [LeadStage.LOST]: 'destructive',
};

const NEXT_STAGES: Record<LeadStage, LeadStage[]> = {
  [LeadStage.NEW]: [LeadStage.NEW, LeadStage.QUALIFIED],
  [LeadStage.QUALIFIED]: [LeadStage.QUALIFIED, LeadStage.WON, LeadStage.LOST],
  [LeadStage.WON]: [LeadStage.WON],
  [LeadStage.LOST]: [LeadStage.LOST],
};

export function LeadsTable({
  leads: initial,
  contacts,
  token,
}: {
  leads: PlatformCrmLead[];
  contacts: PlatformCrmContact[];
  token: string;
}) {
  const t = useTranslations('admin.crm.leads');
  const tc = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const stageFilter = searchParams.get('stage') ?? '';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformCrmLead | null>(null);
  const [form, setForm] = useState({ title: '', contactId: '', source: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () => (stageFilter ? initial.filter((l) => l.stage === stageFilter) : initial),
    [initial, stageFilter],
  );

  function stageLabel(stage: string): string {
    return t(`stage.${stage as 'NEW' | 'QUALIFIED' | 'WON' | 'LOST'}`);
  }

  function updateStageFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('stage', value);
    else params.delete('stage');
    router.push(`/crm/leads?${params.toString()}`);
  }

  function openCreate() {
    setEditing(null);
    setForm({ title: '', contactId: '', source: '' });
    setError('');
    setOpen(true);
  }

  function openEdit(lead: PlatformCrmLead) {
    setEditing(lead);
    setForm({
      title: lead.title,
      contactId: lead.contactId ?? '',
      source: lead.source ?? '',
    });
    setError('');
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const body = JSON.stringify({
        title: form.title,
        contactId: form.contactId || undefined,
        source: form.source || undefined,
      });
      if (editing) {
        await apiFetch(`/platform/crm/leads/${editing.id}`, { method: 'PATCH', body }, token);
      } else {
        await apiFetch('/platform/crm/leads', { method: 'POST', body }, token);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function updateStage(id: string, currentStage: LeadStage, stage: LeadStage) {
    if (stage === currentStage) return;
    try {
      await apiFetch(
        `/platform/crm/leads/${id}`,
        { method: 'PATCH', body: JSON.stringify({ stage }) },
        token,
      );
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : tc('errors.saveFailed'));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return;
    await apiFetch(`/platform/crm/leads/${id}`, { method: 'DELETE' }, token);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Label htmlFor="stage-filter">{t('stageFilter')}</Label>
          <Select
            id="stage-filter"
            value={stageFilter}
            onChange={(e) => updateStageFilter(e.target.value)}
          >
            <option value="">{t('all')}</option>
            {Object.values(LeadStage).map((s) => (
              <option key={s} value={s}>
                {stageLabel(s)}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={openCreate}>{t('add')}</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <div className="rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableTitle')}</TableHead>
                <TableHead>{t('tableStage')}</TableHead>
                <TableHead>{t('tableSource')}</TableHead>
                <TableHead>{t('tableContact')}</TableHead>
                <TableHead>{t('tableUpdated')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.title}</TableCell>
                  <TableCell>
                    <Badge variant={stageVariant[lead.stage] ?? 'secondary'}>
                      {stageLabel(lead.stage)}
                    </Badge>
                  </TableCell>
                  <TableCell>{lead.source ?? '—'}</TableCell>
                  <TableCell>
                    {lead.contact
                      ? `${lead.contact.firstName} ${lead.contact.lastName}`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(lead.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Select
                        value={lead.stage}
                        onChange={(e) =>
                          updateStage(lead.id, lead.stage, e.target.value as LeadStage)
                        }
                        className="w-32"
                      >
                        {NEXT_STAGES[lead.stage].map((s) => (
                          <option key={s} value={s}>
                            {stageLabel(s)}
                          </option>
                        ))}
                      </Select>
                      <Button size="sm" variant="outline" onClick={() => openEdit(lead)}>
                        {tc('edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(lead.id)}
                      >
                        {tc('delete')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? t('editTitle') : t('addTitle')}
        footer={
          <>
            <DialogCloseButton onClose={() => setOpen(false)}>{tc('cancel')}</DialogCloseButton>
            <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
              {tc('save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-title">{t('tableTitle')}</Label>
            <Input
              id="lead-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-contact">{t('tableContact')}</Label>
            <Select
              id="lead-contact"
              value={form.contactId}
              onChange={(e) => setForm({ ...form, contactId: e.target.value })}
            >
              <option value="">{tc('none')}</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-source">{t('tableSource')}</Label>
            <Input
              id="lead-source"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </Dialog>
    </>
  );
}
