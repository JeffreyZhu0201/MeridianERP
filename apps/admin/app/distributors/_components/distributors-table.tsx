'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Badge,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  buttonVariants,
  formatMoney,
} from '@meridian/ui';

import type { PlatformDistributor } from '@/lib/api';

interface DistributorsTableProps {
  distributors: PlatformDistributor[];
}

export function DistributorsTable({ distributors }: DistributorsTableProps) {
  const t = useTranslations('admin.distributors');
  const tc = useTranslations('common');
  const locale = useLocale();

  if (distributors.length === 0) {
    return <EmptyState title={t('empty')} description={t('emptyDescription')} />;
  }

  function commissionLabel(d: PlatformDistributor) {
    if (d.commissionType === 'FIXED') {
      return formatMoney(d.commissionRate, 'CNY', locale);
    }
    return `${Number(d.commissionRate)}%`;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('columns.name')}</TableHead>
          <TableHead>{t('columns.linkedAccount')}</TableHead>
          <TableHead>{t('columns.commission')}</TableHead>
          <TableHead className="text-right">{t('columns.branches')}</TableHead>
          <TableHead>{t('columns.portal')}</TableHead>
          <TableHead>{t('columns.status')}</TableHead>
          <TableHead className="w-[100px]">{t('columns.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {distributors.map((d) => (
          <TableRow key={d.id}>
            <TableCell>
              <Link href={`/distributors/${d.id}`} className="font-medium hover:underline">
                {d.name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {d.accountEmail ?? tc('emptyDash')}
            </TableCell>
            <TableCell className="tabular-nums">{commissionLabel(d)}</TableCell>
            <TableCell className="text-right tabular-nums">{d.recruitedMerchantCount}</TableCell>
            <TableCell>
              <Badge variant={d.portalEnabled ? 'success' : 'secondary'}>
                {d.portalEnabled ? t('portalEnabled') : t('portalDisabled')}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={d.isActive ? 'default' : 'secondary'}>
                {d.isActive ? tc('active') : tc('inactive')}
              </Badge>
            </TableCell>
            <TableCell>
              <Link
                href={`/distributors/${d.id}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                {t('view')}
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
