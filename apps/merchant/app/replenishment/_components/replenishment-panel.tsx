'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  Button,
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
  Textarea,
} from '@meridian/ui';
import type { MasterSkuSummary, ReplenishmentRequestSummary } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface ReplenishmentLine {
  masterSkuId: string;
  quantity: string;
}

interface ReplenishmentPanelProps {
  requests: ReplenishmentRequestSummary[];
  skus: MasterSkuSummary[];
  token: string;
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' {
  if (status === 'APPROVED' || status === 'FULFILLED') return 'default';
  if (status === 'REJECTED') return 'destructive';
  return 'secondary';
}

export function ReplenishmentPanel({ requests, skus, token }: ReplenishmentPanelProps) {
  const t = useTranslations('merchant.replenishment');
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<ReplenishmentLine[]>([
    { masterSkuId: skus[0]?.id ?? '', quantity: '1' },
  ]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function addLine() {
    setLines((prev) => [...prev, { masterSkuId: skus[0]?.id ?? '', quantity: '1' }]);
  }

  function updateLine(index: number, field: keyof ReplenishmentLine, value: string) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        note: note.trim() || undefined,
        lines: lines
          .filter((l) => l.masterSkuId && Number(l.quantity) > 0)
          .map((l) => ({ masterSkuId: l.masterSkuId, quantity: Number(l.quantity) })),
      };
      if (payload.lines.length === 0) {
        throw new Error(t('submitFailed'));
      }
      await apiFetch('/merchant/replenishment', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, token);
      setShowForm(false);
      setNote('');
      setLines([{ masterSkuId: skus[0]?.id ?? '', quantity: '1' }]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('submitFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm((v) => !v)} disabled={skus.length === 0}>
          {t('newRequest')}
        </Button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl ring-1 ring-border p-4">
          <div className="space-y-2">
            <Label htmlFor="replenishment-note">{t('note')}</Label>
            <Textarea
              id="replenishment-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('notePlaceholder')}
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">{t('lines')}</p>
            {lines.map((line, index) => (
              <div key={index} className="flex flex-wrap items-end gap-3">
                <div className="min-w-[200px] flex-1 space-y-1">
                  <Label>{t('sku')}</Label>
                  <Select
                    value={line.masterSkuId}
                    onChange={(e) => updateLine(index, 'masterSkuId', e.target.value)}
                  >
                    <option value="">{t('selectSku')}</option>
                    {skus.map((sku) => (
                      <option key={sku.id} value={sku.id}>
                        {sku.skuCode} — {sku.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-28 space-y-1">
                  <Label>{t('quantity')}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              {t('addLine')}
            </Button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={saving}>
            {saving ? '…' : t('submit')}
          </Button>
        </form>
      ) : null}

      {requests.length === 0 ? (
        <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
      ) : (
        <div className="rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('lines')}</TableHead>
                <TableHead>{t('note')}</TableHead>
                <TableHead>{t('created')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <Badge variant={statusVariant(req.status)}>{req.status}</Badge>
                  </TableCell>
                  <TableCell>{req.lineCount}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {req.note ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
