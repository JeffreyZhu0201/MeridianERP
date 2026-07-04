import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui/server';

import { ListPagination } from '@meridian/ui';
import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch, type PaginatedResponse, type PlatformAccountListItem } from '@/lib/api';
import { requireToken } from '@/lib/auth';
import { UsersFilters } from './_components/users-filters';
import { UsersTable } from './_components/users-table';

interface UsersPageProps {
  searchParams: Promise<{ search?: string; identity?: string; page?: string }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const token = await requireToken();

  const t = await getTranslations('admin.users');
  const tc = await getTranslations('common');
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.identity) query.set('identity', params.identity);
  query.set('page', params.page ?? '1');
  query.set('limit', '20');

  let users: PlatformAccountListItem[] = [];
  let meta = { total: 0, page: 1, limit: 20 };
  try {
    const res = await apiFetch<PaginatedResponse<PlatformAccountListItem>>(
      `/platform/users?${query.toString()}`,
      {},
      token,
    );
    users = res.data;
    meta = res.meta;
  } catch {
    users = [];
  }

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  return (
    <AdminShellWithSession>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[
            { title: t('title'), value: meta.total },
            {
              title: tc('pageOf', { page: meta.page, total: totalPages }),
              value: users.length,
            },
          ]}
        />
        <ListPageFrame
          title={t('title')}
          description={t('description')}
          filters={
            <Suspense>
              <UsersFilters />
            </Suspense>
          }
        >
          <UsersTable users={users} />
          <Suspense>
            <ListPagination
              basePath="/users"
              total={meta.total}
              page={meta.page}
              limit={meta.limit}
              summary={t('pagination', { page: meta.page, totalPages, total: meta.total })}
            />
          </Suspense>
        </ListPageFrame>
      </div>
    </AdminShellWithSession>
  );
}
