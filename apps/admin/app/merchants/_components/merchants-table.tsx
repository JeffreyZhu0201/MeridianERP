'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogCloseButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import { OnboardingStatus } from '@meridian/shared';

import { StatusBadge } from '@/components/status-badge';
import { apiFetch, type MerchantListItem } from '@/lib/api';
import { ApproveDialog } from './approve-dialog';
import { RejectDialog } from './reject-dialog';

interface MerchantsTableProps {
  merchants: MerchantListItem[];
  token: string;
}

export function MerchantsTable({ merchants, token }: MerchantsTableProps) {
  const router = useRouter();
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  async function handleApprove(id: string) {
    setActionError('');
    try {
      await apiFetch(`/platform/merchants/${id}/approve`, { method: 'POST' }, token);
      setApproveId(null);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Approve failed');
    }
  }

  async function handleReject(id: string, reason: string) {
    setActionError('');
    try {
      await apiFetch(
        `/platform/merchants/${id}/reject`,
        { method: 'POST', body: JSON.stringify({ rejectionReason: reason }) },
        token,
      );
      setRejectId(null);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Reject failed');
    }
  }

  if (merchants.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-muted-foreground">No merchants yet</p>
      </div>
    );
  }

  return (
    <>
      {actionError ? <p className="mb-4 text-sm text-destructive">{actionError}</p> : null}
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business Name</TableHead>
              <TableHead>Contact Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                        View
                      </Button>
                    </Link>
                    {merchant.onboardingStatus === OnboardingStatus.SUBMITTED ||
                    merchant.onboardingStatus === OnboardingStatus.UNDER_REVIEW ? (
                      <>
                        <Button size="sm" onClick={() => setApproveId(merchant.id)}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectId(merchant.id)}
                        >
                          Reject
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
        onConfirm={() => approveId && handleApprove(approveId)}
      />
      <RejectDialog
        open={!!rejectId}
        onOpenChange={(open) => !open && setRejectId(null)}
        onConfirm={(reason) => rejectId && handleReject(rejectId, reason)}
      />
    </>
  );
}
