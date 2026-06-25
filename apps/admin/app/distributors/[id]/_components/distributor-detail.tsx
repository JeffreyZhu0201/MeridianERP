'use client';

import { useRouter } from 'next/navigation';
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

  const commissionLabel =
    distributor.commissionType === 'FIXED'
      ? new Intl.NumberFormat(locale, { style: 'currency', currency: 'CNY' }).format(
          Number(distributor.commissionRate),
        )
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

  function formatMoney(value: string | number) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(Number(value));
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
            <span className="font-mono text-xs text-muted-foreground">{invite.code}</span>
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
                  <option value="PERCENT">PERCENT</option>
                  <option value="FIXED">FIXED</option>
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
                          <Button size="sm" variant="outline" onClick={() => handleRevoke(code.id)}>
                            {td('revoke')}
                          </Button>
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
    </DetailPageFrame>
  );
}
