'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import { OnboardingStatus } from '@meridian/shared';

import { StatusBadge } from '@/components/status-badge';
import { apiFetch, type MerchantDetail } from '@/lib/api';
import { ApproveDialog } from '../../_components/approve-dialog';
import { RejectDialog } from '../../_components/reject-dialog';

interface MerchantDetailActionsProps {
  merchant: MerchantDetail;
  token: string;
}

export function MerchantDetailView({ merchant, token }: MerchantDetailActionsProps) {
  const router = useRouter();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [error, setError] = useState('');

  const canReview =
    merchant.onboardingStatus === OnboardingStatus.SUBMITTED ||
    merchant.onboardingStatus === OnboardingStatus.UNDER_REVIEW;

  async function handleApprove() {
    setError('');
    try {
      await apiFetch(`/platform/merchants/${merchant.id}/approve`, { method: 'POST' }, token);
      setApproveOpen(false);
      router.push('/merchants');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed');
    }
  }

  async function handleReject(reason: string) {
    setError('');
    try {
      await apiFetch(
        `/platform/merchants/${merchant.id}/reject`,
        { method: 'POST', body: JSON.stringify({ rejectionReason: reason }) },
        token,
      );
      setRejectOpen(false);
      router.push('/merchants');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link href="/merchants" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to merchants
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{merchant.businessName}</h1>
            <StatusBadge status={merchant.onboardingStatus} />
          </div>
        </div>
        {canReview ? (
          <div className="flex gap-2">
            <Button onClick={() => setApproveOpen(true)}>Approve</Button>
            <Button variant="destructive" onClick={() => setRejectOpen(true)}>
              Reject
            </Button>
          </div>
        ) : merchant.tenantId ? (
          <Link
            href={`/inventory/tenants/${merchant.tenantId}`}
            className="inline-flex h-9 items-center rounded-full border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            View inventory
          </Link>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {merchant.onboardingStatus === OnboardingStatus.REJECTED && merchant.rejectionReason ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-destructive">Rejection reason</p>
          <p className="mt-1">{merchant.rejectionReason}</p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Legal name</span>
              <span>{merchant.legalName ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Contact email</span>
              <span>{merchant.contactEmail}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Contact phone</span>
              <span>{merchant.contactPhone ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Submitted</span>
              <span>
                {merchant.submittedAt
                  ? new Date(merchant.submittedAt).toLocaleString()
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Reviewed</span>
              <span>
                {merchant.reviewedAt ? new Date(merchant.reviewedAt).toLocaleString() : '—'}
              </span>
            </div>
          </CardContent>
        </Card>

        {merchant.crmSummary ? (
          <Card>
            <CardHeader>
              <CardTitle>CRM Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold">{merchant.crmSummary.contacts}</p>
                <p className="text-xs text-muted-foreground">Contacts</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{merchant.crmSummary.companies}</p>
                <p className="text-xs text-muted-foreground">Companies</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{merchant.crmSummary.leads}</p>
                <p className="text-xs text-muted-foreground">Leads</p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {merchant.distributors && merchant.distributors.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Distributors</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {merchant.distributors.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>{d.isActive ? 'Active' : 'Inactive'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <ApproveDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        onConfirm={handleApprove}
      />
      <RejectDialog open={rejectOpen} onOpenChange={setRejectOpen} onConfirm={handleReject} />
    </div>
  );
}
