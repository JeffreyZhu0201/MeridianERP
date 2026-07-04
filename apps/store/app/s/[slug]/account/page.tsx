import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Badge,
  BentoListHeader,
  EmptyState,
  formatMoney,
  ListPageFrame,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui/server';
import type { OrderStatus, StoreOrderListItem } from '@meridian/shared';

import { StoreShellWrapper } from '@/components/store-shell-wrapper';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface AccountPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { slug } = await params;
  const token = await getToken();
  const locale = await getLocale();
  const t = await getTranslations('store');
  const ts = await getTranslations('store.orderStatus');

  if (!token) {
    redirect(`/s/${slug}/login?from=${encodeURIComponent(`/s/${slug}/account`)}`);
  }

  const [orders, cart] = await Promise.all([
    apiFetch<StoreOrderListItem[]>(storePath(slug, 'orders'), {}, token).catch(() => []),
    apiFetch<Cart>(storePath(slug, 'cart'), {}, token).catch(() => null),
  ]);

  const storeName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const orderTotal = orders.reduce((sum, order) => sum + Number(order.total), 0);

  function orderStatusLabel(status: OrderStatus): string {
    return ts(status);
  }

  return (
    <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[
            { title: t('account.order'), value: orders.length },
            {
              title: t('account.total'),
              value: formatMoney(orderTotal, locale),
            },
          ]}
        />
        <ListPageFrame
          title={t('account.title')}
          description={t('account.description')}
          emptyState={
            orders.length === 0 ? (
              <EmptyState
                title={t('account.empty')}
                action={
                  <Link href={`/s/${slug}`} className="text-sm text-primary hover:underline">
                    {t('account.emptyAction')}
                  </Link>
                }
              />
            ) : undefined
          }
        >
          {orders.length > 0 ? (
            <div className="rounded-xl ring-1 ring-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('account.order')}</TableHead>
                    <TableHead>{t('account.date')}</TableHead>
                    <TableHead>{t('account.status')}</TableHead>
                    <TableHead className="text-right">{t('account.total')}</TableHead>
                    <TableHead className="text-right">{t('account.action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}…</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString(locale)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{orderStatusLabel(order.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(order.total, locale, order.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/s/${slug}/orders/${order.id}/confirmation`}
                          className="text-sm text-primary hover:underline"
                        >
                          {t('account.viewOrder')}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </ListPageFrame>
      </div>
    </StoreShellWrapper>
  );
}
