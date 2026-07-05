import { Suspense } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import {
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
import type { PlatformFundsProcurementRow } from '@meridian/shared';

import { ListPagination } from '@meridian/ui';
import { AdminBackLink } from '@/components/admin-back-link';
import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch } from '@/lib/api';
import { requireToken } from '@/lib/auth';

interface ProcurementResponse {
  data: PlatformFundsProcurementRow[];
  meta: { total: number; page: number; limit: number };
  totalSales: number;
  totalProfit: number;
  from: string;
  to: string;
}

export default async function FundsProcurementPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; page?: string }>;
}) {
  const token = await requireToken();
  const params = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations('admin.funds.procurementDetail');
  const tb = await getTranslations('admin.funds');
  const tc = await getTranslations('common');
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  query.set('page', params.page ?? '1');
  query.set('limit', '20');

  let rows: PlatformFundsProcurementRow[] = [];
  let meta = { total: 0, page: 1, limit: 20 };
  let totalSales = 0;
  let totalProfit = 0;
  try {
    const res = await apiFetch<ProcurementResponse>(
      `/platform/funds/procurement?${query.toString()}`,
      {},
      token,
    );
    rows = res.data;
    meta = res.meta;
    totalSales = res.totalSales;
    totalProfit = res.totalProfit;
  } catch {
    rows = [];
  }

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  return (
    <AdminShellWithSession>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[
            { title: t('totalSales'), value: formatMoney(totalSales, locale) },
            { title: t('totalProfit'), value: formatMoney(totalProfit, locale) },
          ]}
        />
        <ListPageFrame
          title={t('title')}
          description={t('description')}
          action={<AdminBackLink href="/funds" label={tb('backToFunds')} />}
          emptyState={rows.length === 0 ? <EmptyState title={t('empty')} /> : undefined}
        >
          {rows.length > 0 ? (
            <div className="rounded-xl ring-1 ring-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('columns.orderNumber')}</TableHead>
                    <TableHead>{t('columns.merchant')}</TableHead>
                    <TableHead>{t('columns.status')}</TableHead>
                    <TableHead className="text-right">{t('columns.sales')}</TableHead>
                    <TableHead className="text-right">{t('columns.cost')}</TableHead>
                    <TableHead className="text-right">{t('columns.profit')}</TableHead>
                    <TableHead>{t('columns.paidAt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.orderNumber}</TableCell>
                      <TableCell>{row.merchantName}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.salesAmount, locale)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.costAmount, locale)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.profitAmount, locale)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.paidAt
                          ? new Date(row.paidAt).toLocaleDateString(locale)
                          : tc('emptyDash')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
          <Suspense>
            <ListPagination
              basePath="/funds/procurement"
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
