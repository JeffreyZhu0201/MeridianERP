import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { OnboardingStatus } from '@meridian/shared';
import
  {
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
  } from '@meridian/ui/server';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch, type MerchantListItem, type PaginatedResponse } from '@/lib/api';
import { requireToken } from '@/lib/auth';

export default async function InventoryIndexPage ()
{
  const token = await requireToken();

  const t = await getTranslations('admin.inventory');

  let merchants: MerchantListItem[] = [];
  let fetchError: string | null = null;
  try {
    const res = await apiFetch<PaginatedResponse<MerchantListItem>>(
      `/platform/merchants?status=${OnboardingStatus.APPROVED}&limit=500`,
      {},
      token,
    );
    merchants = res.data.filter((m) => Boolean(m.tenantId));
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load merchants';
    merchants = [];
  }

  return (
    <AdminShellWithSession>
      <div className="space-y-6">
        <BentoListHeader
          metrics={ [
            { title: t('indexTitle'), value: merchants.length, description: t('indexDescription') },
          ] }
        />
        <ListPageFrame title={ t('indexTitle') } description={ t('indexDescription') }>
          <div className="mb-4">
            <Link
              href="/inventory/master-catalog"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              { t('masterCatalogLink') }
            </Link>
          </div>
          { fetchError ? (
            <EmptyState title={ t('indexLoadError') } description={ fetchError } />
          ) : merchants.length === 0 ? (
            <EmptyState title={ t('indexEmpty') } />
          ) : (
            <div className="rounded-xl ring-1 ring-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{ t('indexColumns.merchant') }</TableHead>
                    <TableHead>{ t('indexColumns.slug') }</TableHead>
                    <TableHead>{ t('indexColumns.flagship') }</TableHead>
                    <TableHead className="text-right">{ t('indexColumns.actions') }</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  { merchants.map((merchant) => (
                    <TableRow key={ merchant.id }>
                      <TableCell className="font-medium">{ merchant.businessName }</TableCell>
                      <TableCell className="font-mono text-xs">{ merchant.slug ?? '—' }</TableCell>
                      <TableCell>
                        { merchant.isFlagship ? (
                          <Badge variant="default">{ t('indexFlagship') }</Badge>
                        ) : (
                          '—'
                        ) }
                      </TableCell>
                      <TableCell className="text-right">
                        { merchant.tenantId ? (
                          <Link
                            href={ `/inventory/tenants/${merchant.tenantId}` }
                            className="text-sm text-primary underline-offset-4 hover:underline"
                          >
                            { t('indexViewInventory') }
                          </Link>
                        ) : null }
                      </TableCell>
                    </TableRow>
                  )) }
                </TableBody>
              </Table>
            </div>
          ) }
        </ListPageFrame>
      </div>
    </AdminShellWithSession>
  );
}
