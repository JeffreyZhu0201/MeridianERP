'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogCloseButton,
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

import { apiFetch, type WithdrawalRequest } from '@/lib/api';

interface WithdrawalsTableProps {
  withdrawals: WithdrawalRequest[];
  token: string;
}

export function WithdrawalsTable({ withdrawals, token }: WithdrawalsTableProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin.withdrawals');
  const tc = useTranslations('common');
  const [error, setError] = useState('');
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatCNY = (value: string | number) => formatMoney(value, 'CNY', locale);

  async function handleApprove() {
    if (!approveId) return;
    setError('');
    try {
      await apiFetch(`/platform/withdrawals/${approveId}/approve`, { method: 'POST' }, token);
      setApproveId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('approveFailed'));
    }
  }

  async function handleReject() {
    if (!rejectId || !rejectReason.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(
        `/platform/withdrawals/${rejectId}/reject`,
        { method: 'POST', body: JSON.stringify({ reason: rejectReason }) },
        token,
      );
      setRejectId(null);
      setRejectReason('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('rejectFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <div className="rounded-xl ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columns.distributor')}</TableHead>
              <TableHead className="text-right">{t('columns.amount')}</TableHead>
              <TableHead>{t('columns.note')}</TableHead>
              <TableHead>{t('columns.status')}</TableHead>
              <TableHead>{t('columns.created')}</TableHead>
              <TableHead className="text-right">{t('columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                <TableCell className="font-medium">{withdrawal.distributor.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCNY(withdrawal.amount)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {withdrawal.note ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{withdrawal.status}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(withdrawal.createdAt).toLocaleDateString(locale)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={() => setApproveId(withdrawal.id)}>
                      {t('approve')}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setRejectId(withdrawal.id)}
                    >
                      {t('reject')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!approveId}
        onOpenChange={(open) => !open && setApproveId(null)}
        title={t('approveTitle')}
        footer={
          <>
            <DialogCloseButton onClose={() => setApproveId(null)}>{tc('cancel')}</DialogCloseButton>
            <Button onClick={handleApprove} disabled={submitting}>
              {t('approve')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          {t('approveConfirm')}
        </p>
      </Dialog>

      <Dialog
        open={!!rejectId}
        onOpenChange={(open) => !open && setRejectId(null)}
        title={t('rejectTitle')}
        footer={
          <>
            <DialogCloseButton onClose={() => setRejectId(null)}>{tc('cancel')}</DialogCloseButton>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={submitting || !rejectReason.trim()}
            >
              {t('reject')}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="reject-reason">{t('rejectReason')}</Label>
          <Textarea
            id="reject-reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
        </div>
      </Dialog>
    </>
  );
}
