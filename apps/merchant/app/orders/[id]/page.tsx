import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import {
  Badge,
  BentoDetailHero,
  DetailPageFrame,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  formatMoney,
} from '@meridian/ui/server';
import type { MerchantOrderDetail, OrderStatus } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const t = await getTranslations('merchant.orders');
  const { id } = await params;
  const token = await getToken();
  if (!token) return null;

  const [order, profile] = await Promise.all([
    apiFetch<MerchantOrderDetail>(`/merchant/orders/${id}`, {}, token).catch(() => null),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  if (!order) {
    return (
      <MerchantShellWrapper businessName={profile?.businessName}>
        <EmptyState
          title={t('notFound')}
          description={t('notFoundDescription')}
          action={
            <Link href="/orders" className="text-sm text-primary hover:underline">
              {t('backToOrders')}
            </Link>
          }
        />
      </MerchantShellWrapper>
    );
  }

  const statusKey = `status.${order.status}` as `status.${OrderStatus}`;

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <DetailPageFrame
        title={t('orderTitle', { id: order.id.slice(0, 8) })}
        backHref="/orders"
        backLabel={t('title')}
        badges={<Badge>{t(statusKey)}</Badge>}
      >
        <BentoDetailHero
          metrics={[
            {
              title: t('customer'),
              value: order.customer?.email ?? order.guestEmail ?? t('guest'),
            },
            {
              title: t('distributor'),
              value: order.distributor?.name ?? '—',
            },
            {
              title: t('total'),
              value: formatMoney(order.total, order.currency),
            },
            {
              title: t('qty'),
              value: order.lines.reduce((sum, line) => sum + line.quantity, 0),
            },
          ]}
        />

        <div className="rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('product')}</TableHead>
                <TableHead>{t('variant')}</TableHead>
                <TableHead>{t('qty')}</TableHead>
                <TableHead className="text-right">{t('lineTotal')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.productName}</TableCell>
                  <TableCell>{line.variantName}</TableCell>
                  <TableCell>{line.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(line.lineTotal, order.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DetailPageFrame>
    </MerchantShellWrapper>
  );
}
