'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Card, CardContent, CardHeader, CardTitle, MetricCard, formatMoney } from '@meridian/ui';
import type { DistributorPerformanceSummary } from '@meridian/shared';

import { dateRangeForPreset, fetchDistributorPerformance } from '@/lib/commissions';

interface PerformancePanelProps {
  distributorId: string;
  token: string;
  initialPerformance?: DistributorPerformanceSummary | null;
}

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(iso),
  );
}

export function PerformancePanel({
  distributorId,
  token,
  initialPerformance,
}: PerformancePanelProps) {
  const t = useTranslations('merchant.distributors.performance');
  const [activeDays, setActiveDays] = useState(30);
  const [performance, setPerformance] = useState<DistributorPerformanceSummary | null>(
    initialPerformance ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const presets = [
    { label: t('preset7'), days: 7 },
    { label: t('preset30'), days: 30 },
    { label: t('preset90'), days: 90 },
  ] as const;

  const loadPerformance = useCallback(
    (days: number) => {
      const range = dateRangeForPreset(days);
      startTransition(async () => {
        try {
          setError(null);
          const data = await fetchDistributorPerformance(distributorId, token, range);
          setPerformance(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : t('loadFailed'));
        }
      });
    },
    [distributorId, token],
  );

  useEffect(() => {
    if (!initialPerformance) {
      loadPerformance(30);
    }
  }, [initialPerformance, loadPerformance]);

  function handlePreset(days: number) {
    setActiveDays(days);
    loadPerformance(days);
  }

  const trend = performance?.trend ?? [];
  const maxCommission = Math.max(...trend.map((p) => Number(p.commissionAccrued)), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.days}
            type="button"
            size="sm"
            variant={activeDays === preset.days ? 'default' : 'outline'}
            onClick={() => handlePreset(preset.days)}
            disabled={isPending}
          >
            {preset.label}
          </Button>
        ))}
        {performance ? (
          <span className="ml-auto text-xs text-muted-foreground">
            {formatShortDate(performance.from)} — {formatShortDate(performance.to)}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title={t('bindingsMerchant')} value={performance?.bindingsMerchant ?? 0} />
        <MetricCard title={t('bindingsCustomer')} value={performance?.bindingsCustomer ?? 0} />
        <MetricCard title={t('attributedOrders')} value={performance?.attributedOrderCount ?? 0} />
        <MetricCard
          title={t('orderRevenue')}
          value={formatMoney(performance?.attributedOrderRevenue ?? 0)}
        />
        <MetricCard
          title={t('commissionAccrued')}
          value={formatMoney(performance?.commissionAccrued ?? 0)}
        />
        <MetricCard
          title={t('commissionSettled')}
          value={formatMoney(performance?.commissionSettled ?? 0)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('trendTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {trend.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('trendEmpty')}</p>
          ) : (
            <div className="flex h-40 items-end gap-1 overflow-x-auto pb-2">
              {trend.map((point) => {
                const height = Math.max(
                  4,
                  (Number(point.commissionAccrued) / maxCommission) * 100,
                );
                return (
                  <div
                    key={point.date}
                    className="flex min-w-[8px] flex-1 flex-col items-center gap-1"
                    title={`${point.date}: ${formatMoney(point.commissionAccrued)}`}
                  >
                    <div
                      className="w-full rounded-sm bg-primary/80"
                      style={{ height: `${height}%` }}
                    />
                    <span className="hidden text-[10px] text-muted-foreground sm:block">
                      {point.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {performance &&
      performance.attributedOrderCount === 0 &&
      performance.bindingsMerchant === 0 &&
      performance.bindingsCustomer === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noActivity')}</p>
      ) : null}
    </div>
  );
}
