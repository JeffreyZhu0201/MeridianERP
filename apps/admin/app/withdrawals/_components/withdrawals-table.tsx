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
import type { WithdrawalRequestRow, WithdrawalRequestStatus } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface WithdrawalsTableProps {
  withdrawals: WithdrawalRequestRow[];
  token: string;
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'warning' {
  if (status === 'APPROVED') return 'default';
  if (status === 'REJECTED') return 'destructive';
  return 'warning';
}

function withdrawalStatusLabel(
  status: string,
  t: ReturnType<typeof useTranslations<'admin.withdrawals'>>,
): string {
  if (status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED') {
    return t(`withdrawalStatus.${status as WithdrawalRequestStatus}`);
  }
  return status;
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
  const emptyDash = tc('emptyDash');

  async function handleApprove() {
    if (!approveId) return;
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(`/platform/withdrawals/${approveId}/approve`, { method: 'POST' }, token);
      setApproveId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('approveFailed'));
    } finally {
      setSubmitting(false);
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
              <TableHead>{t('columns.payoutReference')}</TableHead>
              <TableHead>{t('columns.created')}</TableHead>
              <TableHead>{t('columns.reviewed')}</TableHead>
              <TableHead className="text-right">{t('columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                <TableCell className="font-medium">{withdrawal.distributorName}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCNY(withdrawal.amount)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {withdrawal.note ?? emptyDash}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(withdrawal.status)}>
                    {withdrawalStatusLabel(withdrawal.status, t)}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {withdrawal.payoutReference ?? emptyDash}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(withdrawal.createdAt).toLocaleDateString(locale)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {withdrawal.reviewedAt
                    ? new Date(withdrawal.reviewedAt).toLocaleDateString(locale)
                    : emptyDash}
                  {withdrawal.rejectionReason ? (
                    <span className="mt-1 block text-destructive">
                      {withdrawal.rejectionReason}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  {withdrawal.status === 'PENDING' ? (
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
                  ) : (
                    <span className="text-xs text-muted-foreground">{emptyDash}</span>
                  )}
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
            <Button onClick={() => void handleApprove()} disabled={submitting}>
              {t('approve')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">{t('approveConfirm')}</p>
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
              onClick={() => void handleReject()}
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
