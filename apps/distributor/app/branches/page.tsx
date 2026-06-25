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
} from '@meridian/ui';
import type { DistributorBranchSummary } from '@meridian/shared';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

function formatMoney(value: string | number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(
    Number(value),
  );
}

export default async function BranchesPage() {
  const locale = await getLocale();
  const t = await getTranslations('distributor.branches');
  const token = await getToken();
  if (!token) return null;

  let branches: DistributorBranchSummary[] = [];
  let error: string | null = null;

  try {
    branches = await apiFetch<DistributorBranchSummary[]>('/distributor/me/branches', {}, token);
  } catch (err) {
    error = err instanceof Error ? err.message : t('loadError');
  }

  return (
    <ListPageFrame
      title={t('title')}
      description={t('description')}
      emptyState={
        branches.length === 0 && !error ? (
          <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
        ) : undefined
      }
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {branches.length > 0 ? (
        <div className="space-y-4">
          <BentoListHeader metrics={[{ title: t('title'), value: branches.length }]} />
          <div className="rounded-xl ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('businessName')}</TableHead>
                  <TableHead>{t('slug')}</TableHead>
                  <TableHead>{t('recruitedAt')}</TableHead>
                  <TableHead className="text-right">{t('orderCount')}</TableHead>
                  <TableHead className="text-right">{t('salesLast30')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.tenantId}>
                    <TableCell className="font-medium">{branch.businessName}</TableCell>
                    <TableCell className="font-mono text-xs">{branch.slug}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {branch.recruitedAt
                        ? new Date(branch.recruitedAt).toLocaleDateString(locale)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {branch.orderCountLast30Days}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(branch.salesLast30Days, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </ListPageFrame>
  );
}
