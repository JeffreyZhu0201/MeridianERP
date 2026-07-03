'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogCloseButton,
  EmptyState,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@meridian/ui';

import { apiFetch } from '@/lib/api';
import type { ReplenishmentRequestRow } from '../page';

interface ReplenishmentViewProps {
  requests: ReplenishmentRequestRow[];
  token: string;
  status: string;
}

export function ReplenishmentView({ requests, token, status }: ReplenishmentViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin.replenishment');
  const tc = useTranslations('common');
  const [error, setError] = useState('');
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleApprove() {
    if (!approveId) return;
    setError('');
    try {
      await apiFetch(`/platform/replenishment/${approveId}/approve`, { method: 'POST' }, token);
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
        `/platform/replenishment/${rejectId}/reject`,
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

  const showActions = status === 'PENDING' || !status || status === 'ALL';

  if (requests.length === 0) {
    return <EmptyState title={t('empty')} />;
  }

  return (
    <>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <div className="rounded-xl ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columns.branch')}</TableHead>
              <TableHead>{t('columns.lines')}</TableHead>
              <TableHead>{t('columns.note')}</TableHead>
              <TableHead>{t('columns.created')}</TableHead>
              {showActions ? (
                <TableHead className="text-right">{t('columns.actions')}</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-medium">
                  {req.tenant.merchantProfile?.businessName ?? req.tenant.slug}
                </TableCell>
                <TableCell className="text-xs">
                  {req.lines.map((l) => (
                    <div key={`${req.id}-${l.masterSku.skuCode}`}>
                      {l.masterSku.skuCode} × {l.quantity}
                    </div>
                  ))}
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-muted-foreground">
                  {req.note ?? '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(req.createdAt).toLocaleDateString(locale)}
                </TableCell>
                {showActions ? (
                  <TableCell className="text-right">
                    {req.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => setApproveId(req.id)}>
                          {t('approve')}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setRejectId(req.id)}>
                          {t('reject')}
                        </Button>
                      </div>
                    ) : null}
                  </TableCell>
                ) : null}
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
          <Label htmlFor="repl-reject-reason">{t('rejectReason')}</Label>
          <Textarea
            id="repl-reject-reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
        </div>
      </Dialog>
    </>
  );
}
