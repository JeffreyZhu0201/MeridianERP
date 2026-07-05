'use client';

import Link from 'next/link';
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
  Dialog,
  DialogCloseButton,
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
  Textarea,
} from '@meridian/ui';
import { BentoChartTile } from '@meridian/ui/client-widgets';
import { OnboardingStatus } from '@meridian/shared';
import type {
  PlatformMerchantPluginItem,
  PlatformMerchantPluginsResponse,
  PlatformMerchantStatistics,
} from '@meridian/shared';

import { OnboardingStatusBadge } from '@meridian/ui';
import { apiFetch, type MerchantDetail, type PlatformDistributor } from '@/lib/api';
import { ApproveDialog } from '../../_components/approve-dialog';
import { RejectDialog } from '../../_components/reject-dialog';

interface MerchantDetailActionsProps {
  merchant: MerchantDetail;
  token: string;
  distributors?: PlatformDistributor[];
  plugins?: PlatformMerchantPluginsResponse;
  statistics?: PlatformMerchantStatistics;
}

const orderStatusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PAID: 'default',
  FULFILLED: 'default',
  PENDING_PAYMENT: 'secondary',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
};

export function MerchantDetailView({
  merchant,
  token,
  distributors = [],
  plugins,
  statistics,
}: MerchantDetailActionsProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin.merchants');
  const td = useTranslations('admin.merchants.detail');
  const to = useTranslations('admin.orders');
  const tc = useTranslations('common');
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [recruiterOpen, setRecruiterOpen] = useState(false);
  const [recruiterId, setRecruiterId] = useState('');
  const [recruiterReason, setRecruiterReason] = useState('');
  const [updatingRecruiter, setUpdatingRecruiter] = useState(false);
  const [storePublished, setStorePublished] = useState(merchant.storePublished);
  const [isFlagship, setIsFlagship] = useState(merchant.isFlagship);
  const [savingStoreSettings, setSavingStoreSettings] = useState(false);
  const [storeSettingsSuccess, setStoreSettingsSuccess] = useState(false);
  const [error, setError] = useState('');

  const canReview =
    merchant.onboardingStatus === OnboardingStatus.SUBMITTED ||
    merchant.onboardingStatus === OnboardingStatus.UNDER_REVIEW;

  async function handleApprove(recruitedByDistributorId?: string) {
    setError('');
    try {
      await apiFetch(
        `/platform/merchants/${merchant.id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify(
            recruitedByDistributorId ? { recruitedByDistributorId } : {},
          ),
        },
        token,
      );
      setApproveOpen(false);
      router.push('/merchants');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('approveFailed'));
    }
  }

  async function handleReject(reason: string) {
    setError('');
    try {
      await apiFetch(
        `/platform/merchants/${merchant.id}/reject`,
        { method: 'POST', body: JSON.stringify({ reason }) },
        token,
      );
      setRejectOpen(false);
      router.push('/merchants');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('rejectFailed'));
    }
  }

  async function handleUpdateRecruiter() {
    if (!recruiterId.trim() || !recruiterReason.trim()) return;
    setUpdatingRecruiter(true);
    setError('');
    try {
      await apiFetch(
        `/platform/merchants/${merchant.id}/recruiter`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            recruitedByDistributorId: recruiterId || null,
            reason: recruiterReason,
          }),
        },
        token,
      );
      setRecruiterOpen(false);
      setRecruiterReason('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('updateRecruiterFailed'));
    } finally {
      setUpdatingRecruiter(false);
    }
  }

  async function handleSaveStoreSettings() {
    setSavingStoreSettings(true);
    setStoreSettingsSuccess(false);
    setError('');
    try {
      await apiFetch(
        `/platform/merchants/${merchant.id}/store-settings`,
        {
          method: 'PATCH',
          body: JSON.stringify({ storePublished, isFlagship }),
        },
        token,
      );
      setStoreSettingsSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : td('storeSettingsFailed'));
    } finally {
      setSavingStoreSettings(false);
    }
  }

  const showBusinessStats =
    merchant.onboardingStatus === OnboardingStatus.APPROVED && statistics;

  return (
    <DetailPageFrame
      title={merchant.businessName}
      backHref="/merchants"
      backLabel={t('title')}
      badges={<OnboardingStatusBadge status={merchant.onboardingStatus} />}
      actions={
        canReview ? (
          <div className="flex gap-2">
            <Button onClick={() => setApproveOpen(true)}>{t('approve')}</Button>
            <Button variant="destructive" onClick={() => setRejectOpen(true)}>
              {t('reject')}
            </Button>
          </div>
        ) : merchant.tenantId ? (
          <Link
            href={`/inventory/tenants/${merchant.tenantId}`}
            className="inline-flex h-9 items-center rounded-full border border-border dark:border-border/40 bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            {t('viewInventory')}
          </Link>
        ) : undefined
      }
    >
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <BentoDetailHero
        metrics={
          showBusinessStats
            ? [
                { title: td('orders30d'), value: statistics.ordersLast30Days },
                {
                  title: td('revenue30d'),
                  value: formatMoney(statistics.revenueLast30Days, locale),
                },
                { title: td('products'), value: statistics.productCount },
                { title: td('skus'), value: statistics.skuCount },
                { title: td('lowStock'), value: statistics.lowStockCount },
              ]
            : [
                { title: td('contacts'), value: merchant.crmSummary.contacts },
                { title: td('companies'), value: merchant.crmSummary.companies },
                { title: td('leads'), value: merchant.crmSummary.leads },
              ]
        }
      />

      {showBusinessStats ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <BentoChartTile
            title={td('salesTrend')}
            colSpan={2}
            rowSpan={2}
            data={statistics.trend.map((point) => ({
              date: point.date,
              orderCount: point.orderCount,
              orderRevenue: Number(point.orderRevenue),
            }))}
            series={[
              { key: 'orderCount', label: td('orders30d') },
              { key: 'orderRevenue', label: td('revenue30d') },
            ]}
          />
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{td('recentOrders')}</CardTitle>
              <Link
                href={`/orders?tenantId=${encodeURIComponent(merchant.tenantId)}`}
                className="text-sm text-primary hover:underline"
              >
                {td('viewAllOrders')}
              </Link>
            </CardHeader>
            <CardContent>
              {statistics.recentOrders.length === 0 ? (
                <EmptyState title={td('noOrders')} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{td('orderId')}</TableHead>
                      <TableHead>{to('columns.status')}</TableHead>
                      <TableHead>{td('orderTotal')}</TableHead>
                      <TableHead>{td('orderDate')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statistics.recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-mono text-sm text-primary hover:underline"
                          >
                            {order.id.slice(0, 8)}…
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={orderStatusVariant[order.status] ?? 'secondary'}>
                            {to(`status.${order.status}` as 'status.PAID')}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatMoney(order.total, locale)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString(locale)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {merchant.onboardingStatus === OnboardingStatus.REJECTED && merchant.rejectionReason ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-destructive">{t('rejectReason')}</p>
          <p className="mt-1">{merchant.rejectionReason}</p>
        </div>
      ) : null}

      {merchant.onboardingStatus === OnboardingStatus.APPROVED && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{td('updateRecruiter')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              {td('updateRecruiterDescription')}
            </p>
            <Button variant="outline" onClick={() => setRecruiterOpen(true)}>
              {td('updateRecruiter')}
            </Button>
          </CardContent>
        </Card>
      )}

      {merchant.onboardingStatus === OnboardingStatus.APPROVED && (
        <Card>
          <CardHeader>
            <CardTitle>{td('storeSettings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{td('storeSettingsDescription')}</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border"
                  checked={storePublished}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setStorePublished(next);
                    if (!next) setIsFlagship(false);
                  }}
                />
                {td('storePublished')}
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border"
                  checked={isFlagship}
                  disabled={!storePublished}
                  onChange={(e) => setIsFlagship(e.target.checked)}
                />
                {td('isFlagship')}
              </label>
              <p className="text-xs text-muted-foreground">{td('flagshipHint')}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleSaveStoreSettings} disabled={savingStoreSettings}>
                {td('saveStoreSettings')}
              </Button>
              {storeSettingsSuccess ? (
                <span className="text-sm text-emerald-600">{td('storeSettingsSaved')}</span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {merchant.onboardingStatus === OnboardingStatus.APPROVED && plugins ? (
        <Card>
          <CardHeader>
            <CardTitle>{td('pluginsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {plugins.plugins.map((plugin: PlatformMerchantPluginItem) => {
                const name = td(
                  `pluginNames.${plugin.code}` as
                    | 'pluginNames.crm'
                    | 'pluginNames.hrm'
                    | 'pluginNames.im'
                    | 'pluginNames.finance_tax'
                    | 'pluginNames.oa'
                    | 'pluginNames.e_signature'
                    | 'pluginNames.customer_service',
                );
                return (
                  <Badge
                    key={plugin.code}
                    variant={plugin.installed ? 'default' : 'outline'}
                    title={
                      plugin.installedAt
                        ? td('pluginsInstalledAt', {
                            date: new Date(plugin.installedAt).toLocaleString(locale),
                          })
                        : td('pluginsNotInstalled')
                    }
                  >
                    {name} · {plugin.installed ? td('pluginsInstalled') : td('pluginsNotInstalled')}
                  </Badge>
                );
              })}
            </div>
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
              <span className="text-muted-foreground">{td('legalName')}</span>
              <span>{merchant.legalName ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{td('contactEmail')}</span>
              {merchant.ownerAccountId ? (
                <Link
                  href={`/users/${merchant.ownerAccountId}`}
                  className="text-primary hover:underline"
                >
                  {merchant.contactEmail}
                </Link>
              ) : (
                <span>{merchant.contactEmail}</span>
              )}
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{td('contactPhone')}</span>
              <span>{merchant.contactPhone ?? '—'}</span>
            </div>
            {merchant.pendingRecruiterName ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t('recruitedByPromoter')}</span>
                <span>{merchant.pendingRecruiterName}</span>
              </div>
            ) : merchant.recruitedByDistributorName ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t('recruitedByPromoter')}</span>
                <span>{merchant.recruitedByDistributorName}</span>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{td('submitted')}</span>
              <span>
                {merchant.submittedAt
                  ? new Date(merchant.submittedAt).toLocaleString(locale)
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{td('reviewed')}</span>
              <span>
                {merchant.reviewedAt ? new Date(merchant.reviewedAt).toLocaleString(locale) : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <ApproveDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        onConfirm={handleApprove}
        distributors={distributors}
        defaultRecruiterId={merchant.pendingRecruiterId}
        pendingRecruiterName={merchant.pendingRecruiterName}
      />
      <RejectDialog open={rejectOpen} onOpenChange={setRejectOpen} onConfirm={handleReject} />
      <Dialog
        open={recruiterOpen}
        onOpenChange={setRecruiterOpen}
        title={td('updateRecruiter')}
        footer={
          <>
            <DialogCloseButton onClose={() => setRecruiterOpen(false)}>{tc('cancel')}</DialogCloseButton>
            <Button
              onClick={handleUpdateRecruiter}
              disabled={updatingRecruiter || !recruiterReason.trim()}
            >
              {updatingRecruiter ? tc('saving') : tc('save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recruiter-dist">{td('recruiter')}</Label>
            <Select
              id="recruiter-dist"
              value={recruiterId}
              onChange={(e) => setRecruiterId(e.target.value)}
            >
              <option value="">{td('noRecruiter')}</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recruiter-reason">{td('reason')}</Label>
            <Textarea
              id="recruiter-reason"
              value={recruiterReason}
              onChange={(e) => setRecruiterReason(e.target.value)}
              rows={3}
              placeholder={td('reasonPlaceholder')}
            />
          </div>
        </div>
      </Dialog>
    </DetailPageFrame>
  );
}
