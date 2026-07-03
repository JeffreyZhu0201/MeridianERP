'use client';

import { useTranslations } from 'next-intl';
import {
  Badge,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';

import type { PlatformAccountListItem } from '@/lib/api';

interface UsersTableProps {
  users: PlatformAccountListItem[];
}

export function UsersTable({ users }: UsersTableProps) {
  const t = useTranslations('admin.users');

  if (users.length === 0) {
    return <EmptyState title={t('empty')} description={t('emptyDescription')} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('columns.email')}</TableHead>
          <TableHead>{t('columns.name')}</TableHead>
          <TableHead>{t('columns.identities')}</TableHead>
          <TableHead>{t('columns.merchants')}</TableHead>
          <TableHead>{t('columns.registered')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';
          return (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{name}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.identities.map((identity) => (
                    <Badge key={identity} variant="secondary">
                      {t(`identities.${identity}`)}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>{user.merchantNames.join(', ') || '—'}</TableCell>
              <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
