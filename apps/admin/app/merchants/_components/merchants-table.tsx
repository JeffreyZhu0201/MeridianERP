'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Button,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import { OnboardingStatus } from '@meridian/shared';

import { StatusBadge } from '@/components/status-badge';
import { apiFetch, type MerchantListItem, type PlatformDistributor } from '@/lib/api';
import { ApproveDialog } from './approve-dialog';
import { RejectDialog } from './reject-dialog';

interface MerchantsTableProps {
  merchants: MerchantListItem[];
  token: string;
  distributors?: PlatformDistributor[];
}

export function MerchantsTable({ merchants, token, distributors = [] }: MerchantsTableProps) {
  const router = useRouter();
  const t = useTranslations('admin.merchants');
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  async function handleApprove(id: string, recruitedByDistributorId?: string) {
    setActionError('');
    try {
      await apiFetch(
        `/platform/merchants/${id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify(
            recruitedByDistributorId ? { recruitedByDistributorId } : {},
          ),
        },
        token,
      );
      setApproveId(null);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('approveFailed'));
    }
  }

  async function handleReject(id: string, reason: string) {
    setActionError('');
    try {
      await apiFetch(
        `/platform/merchants/${id}/reject`,
        { method: 'POST', body: JSON.stringify({ reason }) },
        token,
      );
      setRejectId(null);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('rejectFailed'));
    }
  }

  if (merchants.length === 0) {
    return <EmptyState title={t('emptyTable')} />;
  }

  return (
    <>
      {actionError ? <p className="mb-4 text-sm text-destructive">{actionError}</p> : null}
      <div className="rounded-xl ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columns.businessName')}</TableHead>
              <TableHead>{t('columns.contactEmail')}</TableHead>
              <TableHead>{t('columns.status')}</TableHead>
              <TableHead>{t('columns.submitted')}</TableHead>
              <TableHead className="text-right">{t('columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {merchants.map((merchant) => (
              <TableRow key={merchant.id}>
                <TableCell className="font-medium">{merchant.businessName}</TableCell>
                <TableCell>{merchant.contactEmail}</TableCell>
                <TableCell>
                  <StatusBadge status={merchant.onboardingStatus} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {merchant.submittedAt
                    ? new Date(merchant.submittedAt).toLocaleDateString()
                    : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/merchants/${merchant.id}`}>
                      <Button variant="outline" size="sm">
                        {t('view')}
                      </Button>
                    </Link>
                    {merchant.onboardingStatus === OnboardingStatus.SUBMITTED ||
                    merchant.onboardingStatus === OnboardingStatus.UNDER_REVIEW ? (
                      <>
                        <Button size="sm" onClick={() => setApproveId(merchant.id)}>
                          {t('approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectId(merchant.id)}
                        >
                          {t('reject')}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ApproveDialog
        open={!!approveId}
        onOpenChange={(open) => !open && setApproveId(null)}
        onConfirm={(recruitedByDistributorId) =>
          approveId && handleApprove(approveId, recruitedByDistributorId)
        }
        distributors={distributors}
      />
      <RejectDialog
        open={!!rejectId}
        onOpenChange={(open) => !open && setRejectId(null)}
        onConfirm={(reason) => rejectId && handleReject(rejectId, reason)}
      />
    </>
  );
}
