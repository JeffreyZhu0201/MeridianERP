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
import type { PlatformFundsExpectedProfitLine } from '@meridian/shared';

import { ListPagination } from '@meridian/ui';
import { AdminBackLink } from '@/components/admin-back-link';
import { AdminFundsAiInsight } from '@/app/_components/admin-funds-ai-insight';
import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch } from '@/lib/api';
import { requireToken } from '@/lib/auth';

interface ExpectedProfitResponse {
  data: PlatformFundsExpectedProfitLine[];
  meta: { total: number; page: number; limit: number };
  totalExpectedProfit: number;
}

export default async function ExpectedProfitPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const token = await requireToken();
  const params = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations('admin.funds.expectedProfitDetail');
  const tb = await getTranslations('admin.funds');
  const tc = await getTranslations('common');
  const page = params.page ?? '1';

  let rows: PlatformFundsExpectedProfitLine[] = [];
  let meta = { total: 0, page: 1, limit: 50 };
  let totalExpectedProfit = 0;
  try {
    const res = await apiFetch<ExpectedProfitResponse>(
      `/platform/funds/expected-profit?page=${page}&limit=50`,
      {},
      token,
    );
    rows = res.data;
    meta = res.meta;
    totalExpectedProfit = res.totalExpectedProfit;
  } catch {
    rows = [];
  }

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  return (
    <AdminShellWithSession>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[{ title: t('total'), value: formatMoney(totalExpectedProfit, locale) }]}
        />
        <ListPageFrame
          title={t('title')}
          description={t('description')}
          action={<AdminBackLink href="/funds" label={tb('backToFunds')} />}
          emptyState={rows.length === 0 ? <EmptyState title={t('empty')} /> : undefined}
        >
          <AdminFundsAiInsight token={token} metric="expected-profit" />
          {rows.length > 0 ? (
            <div className="rounded-xl ring-1 ring-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('columns.skuCode')}</TableHead>
                    <TableHead>{t('columns.name')}</TableHead>
                    <TableHead className="text-right">{t('columns.onHand')}</TableHead>
                    <TableHead className="text-right">{t('columns.unitCost')}</TableHead>
                    <TableHead className="text-right">{t('columns.wholesalePrice')}</TableHead>
                    <TableHead className="text-right">{t('columns.expectedProfit')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.skuCode}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.quantityOnHand}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.unitCost, locale)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.wholesalePrice, locale)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.expectedProfit, locale)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
          <Suspense>
            <ListPagination
              basePath="/funds/expected-profit"
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
