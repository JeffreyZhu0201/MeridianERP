'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  formatMoney,
} from '@meridian/ui';
import type { CrmStoreCustomerListItem } from '@meridian/shared';

interface StoreCustomersTableProps {
  storeCustomers: CrmStoreCustomerListItem[];
}

function formatName(customer: CrmStoreCustomerListItem): string {
  const parts = [customer.firstName, customer.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '—';
}

function formatDate(iso: string, locale: string): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

export function StoreCustomersTable({ storeCustomers }: StoreCustomersTableProps) {
  const t = useTranslations('merchant.crm.contacts.storeCustomers');
  const locale = useLocale();

  if (storeCustomers.length === 0) {
    return <EmptyState title={t('empty')} />;
  }

  return (
    <div className="rounded-xl ring-1 ring-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('name')}</TableHead>
            <TableHead>{t('email')}</TableHead>
            <TableHead>{t('completedOrders')}</TableHead>
            <TableHead>{t('lastOrderAt')}</TableHead>
            <TableHead className="text-right">{t('totalSpent')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {storeCustomers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>{formatName(customer)}</TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{customer.completedOrderCount}</TableCell>
              <TableCell>{formatDate(customer.lastOrderAt, locale)}</TableCell>
              <TableCell className="text-right">
                {formatMoney(customer.totalSpent)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
