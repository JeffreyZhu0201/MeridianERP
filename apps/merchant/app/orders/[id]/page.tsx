import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import {
  Badge,
  DetailPageFrame,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { MerchantOrderDetail } from '@meridian/shared';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatMoney(value: string | number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value));
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
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Link href="/orders" className="mt-4 text-sm text-primary hover:underline">
          {t('backToOrders')}
        </Link>
      </MerchantShellWrapper>
    );
  }

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <DetailPageFrame
        title={`Order ${order.id.slice(0, 8)}…`}
        backHref="/orders"
        backLabel={t('title')}
        badges={<Badge>{order.status}</Badge>}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-4 text-sm">
            <p className="text-muted-foreground">{t('customer')}</p>
            <p className="mt-1 font-medium">
              {order.customer?.email ?? order.guestEmail ?? t('guest')}
            </p>
          </div>
          <div className="rounded-xl border p-4 text-sm">
            <p className="text-muted-foreground">{t('distributor')}</p>
            <p className="mt-1 font-medium">{order.distributor?.name ?? '—'}</p>
          </div>
          <div className="rounded-xl border p-4 text-sm">
            <p className="text-muted-foreground">{t('total')}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatMoney(order.total, order.currency)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border">
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
