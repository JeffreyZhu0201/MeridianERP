import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import {
  Badge,
  BentoDetailHero,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DetailPageFrame,
  formatMoney,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui/server';
import type { DeliveryAddress, PlatformOrderDetail } from '@meridian/shared';
import { OrderStatus } from '@meridian/shared';

interface OrderDetailViewProps {
  order: PlatformOrderDetail;
  locale: string;
  shipActions?: ReactNode;
}

function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAddress(address: DeliveryAddress): string {
  return [
    address.name,
    address.phone,
    address.line1,
    address.line2,
    [address.city, address.province, address.postalCode].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(' · ');
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PAID: 'default',
  FULFILLED: 'default',
  PENDING_PAYMENT: 'secondary',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
};

export async function OrderDetailView({ order, locale, shipActions }: OrderDetailViewProps) {
  const t = await getTranslations('admin.orders');
  const td = await getTranslations('admin.orders.detail');
  const tc = await getTranslations('common');

  const customerLabel =
    order.customer?.email ??
    order.guestEmail ??
    '—';

  const fulfillmentLabel =
    order.fulfillmentType === 'DELIVERY' ? t('fulfillmentDelivery') : t('fulfillmentPickup');

  const statusLabel =
    td(`status.${order.status}` as `status.${OrderStatus}`) ?? order.status.replace(/_/g, ' ');

  return (
    <DetailPageFrame
      title={td('title', { id: order.id.slice(0, 8) })}
      description={formatDate(order.createdAt, locale)}
      backHref="/orders"
      backLabel={t('title')}
      badges={
        <Badge variant={statusVariant[order.status] ?? 'secondary'}>{statusLabel}</Badge>
      }
      actions={shipActions}
    >
      <BentoDetailHero
        metrics={[
          { title: td('total'), value: formatMoney(order.total, order.currency, locale) },
          { title: td('fulfillment'), value: fulfillmentLabel },
          { title: td('lines'), value: order.lines.length },
          {
            title: td('merchant'),
            value: order.tenant.businessName ?? order.tenant.slug,
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{td('customer')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{td('email')}</span>
              <span>{customerLabel}</span>
            </div>
            {order.customer ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{td('account')}</span>
                <Link href={`/users/${order.customer.accountId}`} className="text-primary hover:underline">
                  {order.customer.firstName || order.customer.lastName
                    ? [order.customer.firstName, order.customer.lastName].filter(Boolean).join(' ')
                    : order.customer.email}
                </Link>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{td('merchant')}</span>
              <span>{order.tenant.businessName ?? order.tenant.slug}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{td('distributor')}</span>
              <span>
                {order.distributor ? (
                  <Link
                    href={`/distributors/${order.distributor.id}`}
                    className="text-primary hover:underline"
                  >
                    {order.distributor.name}
                  </Link>
                ) : (
                  tc('emptyDash')
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{td('fulfillmentDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{td('fulfillment')}</span>
              <span>{fulfillmentLabel}</span>
            </div>
            {order.fulfillmentType === 'DELIVERY' ? (
              <div className="space-y-1">
                <span className="text-muted-foreground">{td('deliveryAddress')}</span>
                <p className="text-right">
                  {order.deliveryAddress ? formatAddress(order.deliveryAddress) : tc('emptyDash')}
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{td('pickupCode')}</span>
                  <span className="font-mono">{order.pickupCode ?? tc('emptyDash')}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{td('pickupVerified')}</span>
                  <span>{formatDate(order.pickupVerifiedAt, locale)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{td('shippedAt')}</span>
              <span>{formatDate(order.shippedAt, locale)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{td('lineItems')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{td('product')}</TableHead>
                <TableHead>{td('sku')}</TableHead>
                <TableHead className="text-right">{td('qty')}</TableHead>
                <TableHead className="text-right">{td('unitPrice')}</TableHead>
                <TableHead className="text-right">{td('lineTotal')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <div className="font-medium">{line.productName}</div>
                    {line.variantName ? (
                      <div className="text-xs text-muted-foreground">{line.variantName}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {line.skuCode ?? tc('emptyDash')}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(line.unitPrice, order.currency, locale)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatMoney(line.lineTotal, order.currency, locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{td('timestamps')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{td('createdAt')}</span>
            <span>{formatDate(order.createdAt, locale)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{td('shippedAt')}</span>
            <span>{formatDate(order.shippedAt, locale)}</span>
          </div>
          {order.fulfillmentType === 'PICKUP' ? (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{td('pickupVerified')}</span>
              <span>{formatDate(order.pickupVerifiedAt, locale)}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </DetailPageFrame>
  );
}
