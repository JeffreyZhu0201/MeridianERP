'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  Button,
  EmptyState,
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
  const t = useTranslations('merchant.crm.leads');
  const tCommon = useTranslations('common');
  const stageFilter = searchParams.get('stage') ?? '';
  const [leads] = useState(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', contactId: '', source: '' });
  const [error, setError] = useState('');

  const filtered = stageFilter ? leads.filter((l) => l.stage === stageFilter) : leads;

  function stageLabel(stage: string): string {
    return t(`stage.${stage as 'NEW' | 'QUALIFIED' | 'WON' | 'LOST'}`);
  }

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
      setError(err instanceof Error ? err.message : tCommon('errors.saveFailed'));
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
        <Button onClick={() => setOpen(true)}>{t('add')}</Button>
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
                <TableHead className="text-right">{t('changeStage')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    <Link href={`/crm/leads/${lead.id}`} className="hover:underline">
                      {lead.title}
                    </Link>
                  </TableCell>
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
                    <Select
                      value={lead.stage}
                      onChange={(e) => updateStage(lead.id, e.target.value)}
                      className="w-32"
                    >
                      {Object.values(LeadStage).map((s) => (
                        <option key={s} value={s}>
                          {stageLabel(s)}
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
        title={t('addTitle')}
        footer={
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleSave}>{tCommon('save')}</Button>
          </SheetFooter>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('tableTitle')}</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactId">{t('tableContact')}</Label>
            <Select
              id="contactId"
              value={form.contactId}
              onChange={(e) => setForm({ ...form, contactId: e.target.value })}
            >
              <option value="">{tCommon('none')}</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">{t('tableSource')}</Label>
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
