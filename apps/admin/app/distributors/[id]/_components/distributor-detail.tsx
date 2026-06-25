'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
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
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';

import {
  apiFetch,
  type DistributorBranch,
  type PlatformDistributor,
  type RecruitInviteCode,
} from '@/lib/api';

interface DistributorDetailViewProps {
  distributor: PlatformDistributor;
  branches: DistributorBranch[];
  token: string;
}

export function DistributorDetailView({
  distributor,
  branches,
  token,
}: DistributorDetailViewProps) {
  const locale = useLocale();
  const t = useTranslations('admin.distributors');
  const td = useTranslations('admin.distributors.detail');
  const tc = useTranslations('common');
  const [invite, setInvite] = useState<RecruitInviteCode | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const commissionLabel =
    distributor.commissionType === 'FIXED'
      ? `$${Number(distributor.commissionRate)}`
      : `${Number(distributor.commissionRate)}%`;

  async function handleInviteCode() {
    setLoadingInvite(true);
    setError('');
    try {
      const result = await apiFetch<RecruitInviteCode>(
        `/platform/distributors/${distributor.id}/invite-code`,
        { method: 'POST', body: JSON.stringify({}) },
        token,
      );
      setInvite(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : td('inviteCodeFailed'));
    } finally {
      setLoadingInvite(false);
    }
  }

  async function handleCopy() {
    if (!invite?.url) return;
    await navigator.clipboard.writeText(invite.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatMoney(value: string | number) {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(
      Number(value),
    );
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
          { title: t('columns.email'), value: distributor.email ?? '—' },
        ]}
      />

      {invite ? (
        <Card>
          <CardHeader>
            <CardTitle>{td('inviteUrl')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <Input readOnly value={invite.url} className="font-mono text-xs" />
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? td('copied') : td('copy')}
            </Button>
            <span className="text-xs text-muted-foreground font-mono">{invite.code}</span>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{td('profile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('columns.email')}</span>
              <span>{distributor.email ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{td('phone')}</span>
              <span>{distributor.phone ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{td('commission')}</span>
              <span>{commissionLabel}</span>
            </div>
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
      </div>
    </DetailPageFrame>
  );
}
