'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  Button,
  EmptyState,
  formatMoney,
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
import type { WithdrawalRequestRow, WithdrawalRequestStatus } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface WithdrawalsPanelProps {
  withdrawals: WithdrawalRequestRow[];
  availableBalance: number;
  token: string;
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'warning' {
  if (status === 'APPROVED') return 'default';
  if (status === 'REJECTED') return 'destructive';
  return 'warning';
}

function withdrawalStatusLabel(
  status: string,
  t: ReturnType<typeof useTranslations<'distributor'>>,
): string {
  if (status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED') {
    return t(`withdrawalStatus.${status as WithdrawalRequestStatus}`);
  }
  return status;
}

export function WithdrawalsPanel({
  withdrawals,
  availableBalance,
  token,
}: WithdrawalsPanelProps) {
  const locale = useLocale();
  const t = useTranslations('distributor.withdrawals');
  const td = useTranslations('distributor');
  const tc = useTranslations('common');
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const emptyDash = tc('emptyDash');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const parsed = Number(amount);
      if (!parsed || parsed <= 0) {
        throw new Error(t('submitFailed'));
      }
      await apiFetch('/distributor/me/withdrawals', {
        method: 'POST',
        body: JSON.stringify({ amount: parsed, note: note.trim() || undefined }),
      }, token);
      setAmount('');
      setNote('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('submitFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl ring-1 ring-border p-4">
        <p className="text-sm text-muted-foreground">
          {t('availableBalance')}:{' '}
          <span className="font-medium text-foreground tabular-nums">
            {formatMoney(availableBalance, locale)}
          </span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="withdrawal-amount">{t('amount')}</Label>
            <Input
              id="withdrawal-amount"
              type="number"
              min={0.01}
              step="0.01"
              max={availableBalance}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="withdrawal-note">{t('note')}</Label>
            <Textarea
              id="withdrawal-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('notePlaceholder')}
              rows={2}
            />
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={saving || availableBalance <= 0}>
          {saving ? tc('saving') : t('submit')}
        </Button>
      </form>

      {withdrawals.length === 0 ? (
        <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
      ) : (
        <div className="rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('amount')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('note')}</TableHead>
                <TableHead>{t('payoutReference')}</TableHead>
                <TableHead>{t('created')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="tabular-nums font-medium">
                    {formatMoney(row.amount, locale)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(row.status)}>
                      {withdrawalStatusLabel(row.status, td)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {row.note ?? emptyDash}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {row.payoutReference ?? emptyDash}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(row.createdAt).toLocaleDateString(locale)}
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
