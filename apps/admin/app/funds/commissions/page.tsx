import Link from 'next/link';
import { Suspense } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  Badge,
  BentoListHeader,
  EmptyState,
  ListPageFrame,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  formatMoney,
} from '@meridian/ui/server';
import type { PlatformFundsCommissionRow } from '@meridian/shared';

import { ListPagination } from '@meridian/ui';
import { AdminBackLink } from '@/components/admin-back-link';
import { AdminFundsAiInsight } from '@/app/_components/admin-funds-ai-insight';
import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch } from '@/lib/api';
import { requireToken } from '@/lib/auth';

interface CommissionsResponse {
  data: PlatformFundsCommissionRow[];
  meta: { total: number; page: number; limit: number };
  totalCommissions: number;
  from: string;
  to: string;
}

export default async function FundsCommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; page?: string }>;
}) {
  const token = await requireToken();
  const params = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations('admin.funds.commissionsDetail');
  const tb = await getTranslations('admin.funds');
  const tc = await getTranslations('common');
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  query.set('page', params.page ?? '1');
  query.set('limit', '20');

  let rows: PlatformFundsCommissionRow[] = [];
  let meta = { total: 0, page: 1, limit: 20 };
  let totalCommissions = 0;
  try {
    const res = await apiFetch<CommissionsResponse>(
      `/platform/funds/commissions?${query.toString()}`,
      {},
      token,
    );
    rows = res.data;
    meta = res.meta;
    totalCommissions = res.totalCommissions;
  } catch {
    rows = [];
  }

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  return (
    <AdminShellWithSession>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[{ title: t('total'), value: formatMoney(totalCommissions, locale) }]}
        />
        <ListPageFrame
          title={t('title')}
          description={t('description')}
          action={
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/withdrawals#settlements"
                className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {tb('goToSettlements')}
              </Link>
              <AdminBackLink href="/funds" label={tb('backToFunds')} />
            </div>
          }
          emptyState={rows.length === 0 ? <EmptyState title={t('empty')} /> : undefined}
        >
          <AdminFundsAiInsight
            token={token}
            metric="commissions"
            from={params.from}
            to={params.to}
          />
          {rows.length > 0 ? (
            <div className="rounded-xl ring-1 ring-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('columns.distributor')}</TableHead>
                    <TableHead>{t('columns.merchant')}</TableHead>
                    <TableHead className="text-right">{t('columns.amount')}</TableHead>
                    <TableHead>{t('columns.status')}</TableHead>
                    <TableHead>{t('columns.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.distributorName}</TableCell>
                      <TableCell>{row.merchantLabel}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.amount, locale)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status === 'SETTLED' ? 'default' : 'secondary'}>
                          {t(`status.${row.status}` as 'status.ACCRUED')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(row.createdAt).toLocaleDateString(locale)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
          <Suspense>
            <ListPagination
              basePath="/funds/commissions"
              total={meta.total}
              page={meta.page}
              limit={meta.limit}
              summary={tc('pageOf', { page: meta.page, total: totalPages })}
            />
          </Suspense>
        </ListPageFrame>
      </div>
    </AdminShellWithSession>
  );
}
