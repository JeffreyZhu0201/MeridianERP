import { LedgerStatus, OrderStatus, Prisma } from '@prisma/client';
import type { PerformanceTrendPoint } from '@meridian/shared';
import { eachUtcDay } from './date-range';

type OrderTrendRow = {
  createdAt: Date;
  total: Prisma.Decimal;
  commissionEntry?: { amount: Prisma.Decimal; status: LedgerStatus } | null;
};

export function buildOrderTrend(
  from: Date,
  to: Date,
  orders: OrderTrendRow[],
): PerformanceTrendPoint[] {
  const trendMap = new Map<
    string,
    {
      orderCount: number;
      orderRevenue: Prisma.Decimal;
      commissionAccrued: Prisma.Decimal;
    }
  >();
  for (const day of eachUtcDay(from, to)) {
    trendMap.set(day, {
      orderCount: 0,
      orderRevenue: new Prisma.Decimal(0),
      commissionAccrued: new Prisma.Decimal(0),
    });
  }
  for (const order of orders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    const bucket = trendMap.get(day);
    if (!bucket) continue; // 跳过不在日期范围内的订单
    bucket.orderCount += 1;
    bucket.orderRevenue = bucket.orderRevenue.plus(order.total);
    if (order.commissionEntry?.status === LedgerStatus.ACCRUED) {
      bucket.commissionAccrued = bucket.commissionAccrued.plus(
        order.commissionEntry.amount,
      );
    }
  }
  return [...trendMap.entries()].map(([date, bucket]) => ({
    date,
    orderCount: bucket.orderCount,
    orderRevenue: bucket.orderRevenue.toString(),
    commissionAccrued: bucket.commissionAccrued.toString(),
  }));
}

export const PAID_ORDER_STATUS = OrderStatus.PAID;
