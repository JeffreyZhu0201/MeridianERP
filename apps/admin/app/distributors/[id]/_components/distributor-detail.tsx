'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  BentoDetailHero,
  DetailPageFrame,
  EmptyState,
  formatMoney,
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

import { apiFetch, type DistributorBranch } from '@/lib/api';
import type { DistributorCommissionEntry, DistributorFundsSummary, WithdrawalRequestRow, WithdrawalRequestStatus } from '@meridian/shared';
import { LedgerStatus } from '@meridian/shared';
import type { DistributorDetailResponse } from '../page';

interface DistributorDetailViewProps {
  distributor: DistributorDetailResponse;
  branches: DistributorBranch[];
  token: string;
}

export function DistributorDetailView({
  distributor: initial,
  branches,
  token,
}: DistributorDetailViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin.distributors');
  const td = useTranslations('admin.distributors.detail');
  const tw = useTranslations('admin.withdrawals');
  const tc = useTranslations('common');
  const [distributor, setDistributor] = useState(initial);
  const [invite, setInvite] = useState<{ url: string; code: string } | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [portalPassword, setPortalPassword] = useState('');
  const [name, setName] = useState(distributor.name);
  const [commissionRate, setCommissionRate] = useState(String(distributor.commissionRate));
  const [commissionType, setCommissionType] = useState(distributor.commissionType);
  const [isActive, setIsActive] = useState(distributor.isActive);
  const [commissionEntries, setCommissionEntries] = useState<DistributorCommissionEntry[]>([]);
  const [loadingCommission, setLoadingCommission] = useState(true);
  const [fundsSummary, setFundsSummary] = useState<DistributorFundsSummary | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestRow[]>([]);
  const [loadingFunds, setLoadingFunds] = useState(true);

  const formatCNY = (value: string | number) => formatMoney(value, 'CNY', locale);
  const emptyDash = tc('emptyDash');

  const sequenceLabel = (entry: DistributorCommissionEntry) => {
    const seq = entry.merchantAllocationSequence ?? entry.customerOrderSequence;
    if (seq === 1) return td('allocationSequenceFirst');
    if (seq === 2) return td('allocationSequenceSecond');
    return emptyDash;
  };

  const sourceLabel = (source: string | null | undefined) => {
    if (source === 'ALLOCATION') return td('sourceAllocation');
    if (source === 'RETAIL') return td('sourceRetail');
    return td('sourceAllocation');
  };

  const ledgerStatusLabel = (status: string) => {
    if (status === LedgerStatus.ACCRUED || status === LedgerStatus.SETTLED || status === LedgerStatus.VOID) {
      return td(`ledgerStatus.${status}`);
    }
    return status;
  };

  const withdrawalStatusLabel = (status: string) => {
    if (status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED') {
      return tw(`withdrawalStatus.${status as WithdrawalRequestStatus}`);
    }
    return status;
  };

  useEffect(() => {
    let cancelled = false;
    async function loadCommission() {
      setLoadingCommission(true);
      try {
        const res = await apiFetch<{ items: DistributorCommissionEntry[] }>(
          `/platform/distributors/${distributor.id}/commission-entries?limit=50`,
          {},
          token,
        );
        if (!cancelled) setCommissionEntries(res.items);
      } catch {
        if (!cancelled) setCommissionEntries([]);
      } finally {
        if (!cancelled) setLoadingCommission(false);
      }
    }
    void loadCommission();
    return () => {
      cancelled = true;
    };
  }, [distributor.id, token]);

  useEffect(() => {
    let cancelled = false;
    async function loadFunds() {
      setLoadingFunds(true);
      try {
        const [summary, withdrawalRows] = await Promise.all([
          apiFetch<DistributorFundsSummary>(
            `/platform/distributors/${distributor.id}/funds-summary`,
            {},
            token,
          ),
          apiFetch<WithdrawalRequestRow[]>(
            `/platform/distributors/${distributor.id}/withdrawals`,
            {},
            token,
          ),
        ]);
        if (!cancelled) {
          setFundsSummary(summary);
          setWithdrawals(withdrawalRows);
        }
      } catch {
        if (!cancelled) {
          setFundsSummary(null);
          setWithdrawals([]);
        }
      } finally {
        if (!cancelled) setLoadingFunds(false);
      }
    }
    void loadFunds();
    return () => {
      cancelled = true;
    };
  }, [distributor.id, token]);

  const commissionLabel =
    distributor.commissionType === 'FIXED'
      ? formatCNY(distributor.commissionRate)
      : `${Number(distributor.commissionRate)}%`;

  async function handleInviteCode() {
    setLoadingInvite(true);
    setError('');
    try {
      const result = await apiFetch<{ url: string; code: string }>(
        `/platform/distributors/${distributor.id}/invite-code`,
        { method: 'POST', body: JSON.stringify({}) },
        token,
      );
      setInvite(result);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : td('inviteCodeFailed'));
    } finally {
      setLoadingInvite(false);
    }
  }

  async function handleRevoke(codeId: string) {
    setError('');
    try {
      await apiFetch(
        `/platform/distributors/${distributor.id}/invite-code/${codeId}/revoke`,
        { method: 'POST' },
        token,
      );
      setDistributor((d) => ({
        ...d,
        inviteCodes: d.inviteCodes.map((c) =>
          c.id === codeId ? { ...c, revokedAt: new Date().toISOString() } : c,
        ),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : td('revokeFailed'));
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await apiFetch(
        `/platform/distributors/${distributor.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            commissionRate: Number(commissionRate),
            commissionType,
            isActive,
          }),
        },
        token,
      );
      setDistributor((d) => ({
        ...d,
        name,
        commissionRate: Number(commissionRate),
        commissionType,
        isActive,
      }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : td('saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleEnablePortal() {
    if (!portalPassword.trim()) return;
    setError('');
    try {
      await apiFetch(
        `/platform/distributors/${distributor.id}/portal`,
        { method: 'POST', body: JSON.stringify({ password: portalPassword }) },
        token,
      );
      setDistributor((d) => ({ ...d, portalEnabled: true }));
      setPortalPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : td('portalFailed'));
    }
  }

  async function handleCopy() {
    if (!invite?.url) return;
    await navigator.clipboard.writeText(invite.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DetailPageFrame
      title={distributor.name}
      backHref="/distributors"
      backLabel={t('title')}
      badges={
        <Badge variant={distributor.isActive ? 'success' : 'secondary'}>
          {distributor.isActive ? tc('active') : tc('inactive')}
        </Badge>
      }
      actions={
        <Button onClick={handleInviteCode} disabled={loadingInvite}>
          {td('inviteCode')}
        </Button>
      }
    >
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <BentoDetailHero
        metrics={[
          { title: td('merchantsRecruited'), value: distributor.recruitedMerchantCount },
          { title: td('commission'), value: commissionLabel },
          {
            title: td('portal'),
            value: distributor.portalEnabled ? tc('yes') : tc('no'),
          },
          { title: t('columns.email'), value: distributor.email ?? emptyDash },
          ...(distributor.accountEmail
            ? [{ title: td('linkedAccount'), value: distributor.accountEmail }]
            : []),
          ...(fundsSummary
            ? [
                {
                  title: td('availableBalance'),
                  value: formatCNY(fundsSummary.availableBalance),
                },
                {
                  title: td('pendingWithdrawals'),
                  value: formatCNY(fundsSummary.pendingWithdrawals),
                },
              ]
            : []),
        ]}
      />

      {!loadingFunds && fundsSummary ? (
        <Card>
          <CardHeader>
            <CardTitle>{td('fundsSummary')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">{td('accruedTotal')}</p>
              <p className="text-lg font-medium tabular-nums">
                {formatCNY(fundsSummary.accruedTotal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{td('settledTotal')}</p>
              <p className="text-lg font-medium tabular-nums">
                {formatCNY(fundsSummary.settledTotal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{td('availableBalance')}</p>
              <p className="text-lg font-medium tabular-nums">
                {formatCNY(fundsSummary.availableBalance)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{td('pendingWithdrawals')}</p>
              <p className="text-lg font-medium tabular-nums">
                {formatCNY(fundsSummary.pendingWithdrawals)}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {invite ? (
        <Card>
          <CardHeader>
            <CardTitle>{td('inviteUrl')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="rounded-lg border bg-white p-4">
                <QRCode value={invite.url} size={160} />
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <Input readOnly value={invite.url} className="font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? td('copied') : td('copy')}
                </Button>
                <span className="font-mono text-xs text-muted-foreground">{invite.code}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{td('editSettings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dist-name">{t('columns.name')}</Label>
              <Input id="dist-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dist-rate">{td('commissionRate')}</Label>
                <Input
                  id="dist-rate"
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dist-type">{td('commissionType')}</Label>
                <Select
                  id="dist-type"
                  value={commissionType}
                  onChange={(e) => setCommissionType(e.target.value)}
                >
                  <option value="PERCENT">{t('form.percent')}</option>
                  <option value="FIXED">{t('form.fixed')}</option>
                </Select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              {tc('active')}
            </label>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? tc('saving') : tc('save')}
            </Button>
            {!distributor.portalEnabled ? (
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="portal-pw">{td('portalPassword')}</Label>
                <Input
                  id="portal-pw"
                  type="password"
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                />
                <Button variant="outline" size="sm" onClick={handleEnablePortal}>
                  {td('enablePortal')}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{td('inviteHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {distributor.inviteCodes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{td('columns.code')}</TableHead>
                    <TableHead>{td('columns.uses')}</TableHead>
                    <TableHead>{tc('status')}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributor.inviteCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono">{code.code}</TableCell>
                      <TableCell>{code.useCount}</TableCell>
                      <TableCell>
                        {code.revokedAt ? (
                          <Badge variant="destructive">{td('revoked')}</Badge>
                        ) : (
                          <Badge variant="secondary">{tc('active')}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!code.revokedAt ? (
                          <div className="flex items-center justify-end gap-2">
                            <div className="hidden rounded border bg-white p-1 lg:block">
                              <QRCode value={code.url} size={64} />
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleRevoke(code.id)}>
                              {td('revoke')}
                            </Button>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState title={td('noInvites')} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{td('withdrawals')}</CardTitle>
          <Link
            href={`/withdrawals?distributorId=${distributor.id}`}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {td('viewAllWithdrawals')}
          </Link>
        </CardHeader>
        <CardContent>
          {loadingFunds ? (
            <p className="text-sm text-muted-foreground">{tc('loading')}</p>
          ) : withdrawals.length > 0 ? (
            <div className="rounded-xl ring-1 ring-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{td('columns.amount')}</TableHead>
                    <TableHead>{tc('status')}</TableHead>
                    <TableHead>{td('columns.requested')}</TableHead>
                    <TableHead>{td('columns.reviewed')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.slice(0, 10).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-right tabular-nums">
                        {formatCNY(row.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{withdrawalStatusLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(row.createdAt).toLocaleDateString(locale)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.reviewedAt
                          ? new Date(row.reviewedAt).toLocaleDateString(locale)
                          : emptyDash}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState title={td('noWithdrawals')} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{td('branches')}</CardTitle>
        </CardHeader>
        <CardContent>
          {branches.length > 0 ? (
            <div className="rounded-xl ring-1 ring-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{td('columns.business')}</TableHead>
                    <TableHead>{td('columns.slug')}</TableHead>
                    <TableHead className="text-right">{td('columns.sales')}</TableHead>
                    <TableHead className="text-right">{td('columns.orders')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.tenantId}>
                      <TableCell className="font-medium">{branch.businessName}</TableCell>
                      <TableCell className="font-mono text-xs">{branch.slug}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(branch.salesLast30Days)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {branch.orderCountLast30Days}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState title={td('noBranches')} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{td('commissionEntries')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCommission ? (
            <p className="text-sm text-muted-foreground">{tc('loading')}</p>
          ) : commissionEntries.length > 0 ? (
            <div className="rounded-xl ring-1 ring-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{td('columns.business')}</TableHead>
                    <TableHead>{td('allocationSequence')}</TableHead>
                    <TableHead>{td('commissionSource')}</TableHead>
                    <TableHead className="text-right">{td('wholesaleBase')}</TableHead>
                    <TableHead className="text-right">{t('columns.commission')}</TableHead>
                    <TableHead>{tc('status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.businessName}</TableCell>
                      <TableCell>{sequenceLabel(entry)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.commissionSource === 'RETAIL' ? 'outline' : 'secondary'
                          }
                        >
                          {sourceLabel(entry.commissionSource)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCNY(entry.orderTotal)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCNY(entry.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ledgerStatusLabel(entry.status)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState title={td('noCommissionEntries')} />
          )}
        </CardContent>
      </Card>
    </DetailPageFrame>
  );
}
