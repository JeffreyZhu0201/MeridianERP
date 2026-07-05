'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  formatMoney,
  Input,
  Label,
} from '@meridian/ui';
import { IconChevronRight } from '@tabler/icons-react';
import type { PlatformFundsOverview } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

const CURRENCY = 'CNY';

interface FundsOverviewProps {
  initialOverview: PlatformFundsOverview;
  token: string;
}

type StatKey =
  | 'inventoryCost'
  | 'expectedProfit'
  | 'procurement'
  | 'commissions'
  | 'netProfit';

const STAT_ROUTES: Record<StatKey, string> = {
  inventoryCost: '/funds/inventory-cost',
  expectedProfit: '/funds/expected-profit',
  procurement: '/funds/procurement',
  commissions: '/funds/commissions',
  netProfit: '/funds/net-profit',
};

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function FundsOverview({ initialOverview, token }: FundsOverviewProps) {
  const t = useTranslations('admin.funds');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [overview, setOverview] = useState(initialOverview);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(searchParams.get('from')?.slice(0, 10) ?? '');
  const [to, setTo] = useState(searchParams.get('to')?.slice(0, 10) ?? '');

  const formatCNY = (value: number) => formatMoney(value, CURRENCY, locale);

  function buildDetailHref(key: StatKey): string {
    const base = STAT_ROUTES[key];
    if (key === 'inventoryCost' || key === 'expectedProfit') return base;
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  async function applyRange(nextFrom: string, nextTo: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (nextFrom) params.set('from', nextFrom);
      if (nextTo) params.set('to', nextTo);
      const path = `/platform/funds/overview${params.toString() ? `?${params}` : ''}`;
      const data = await apiFetch<PlatformFundsOverview>(path, {}, token);
      setOverview(data);
      setFrom(nextFrom);
      setTo(nextTo);
      const urlParams = new URLSearchParams(searchParams.toString());
      if (nextFrom) urlParams.set('from', nextFrom);
      else urlParams.delete('from');
      if (nextTo) urlParams.set('to', nextTo);
      else urlParams.delete('to');
      router.replace(`/funds?${urlParams.toString()}`);
    } finally {
      setLoading(false);
    }
  }

  function applyLast30Days() {
    void applyRange(isoDateDaysAgo(30), new Date().toISOString().slice(0, 10));
  }

  const stats: Array<{
    key: StatKey;
    title: string;
    hint: string;
    value: string;
    subValue?: string;
    badge?: string;
    highlight?: boolean;
  }> = [
    {
      key: 'inventoryCost',
      title: t('inventoryCost'),
      hint: t('inventoryCostHint'),
      value: formatCNY(overview.inventoryCost),
      badge: t('snapshot'),
    },
    {
      key: 'expectedProfit',
      title: t('expectedProfit'),
      hint: t('expectedProfitHint'),
      value: formatCNY(overview.expectedProfit),
      badge: t('snapshot'),
    },
    {
      key: 'procurement',
      title: t('procurementSales'),
      hint: t('procurementHint'),
      value: formatCNY(overview.procurementSales),
      subValue: `${t('procurementProfit')} ${formatCNY(overview.procurementProfit)}`,
      badge: t('periodMetrics'),
    },
    {
      key: 'commissions',
      title: t('distributorCommissions'),
      hint: t('distributorCommissionsHint'),
      value: formatCNY(overview.distributorCommissions),
      badge: t('periodMetrics'),
    },
    {
      key: 'netProfit',
      title: t('netProfit'),
      hint: t('netProfitHint'),
      value: formatCNY(overview.netProfit),
      badge: t('periodMetrics'),
      highlight: true,
    },
  ];

  return (
    <div className="space-y-6">
      <Alert className="border-border bg-muted/20">
        <AlertDescription className="text-sm text-muted-foreground">
          {t('metricsLegend')}
        </AlertDescription>
      </Alert>

      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">{t('periodFilter')}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={applyLast30Days}
            disabled={loading}
          >
            {t('quickLast30')}
          </Button>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="funds-from">{t('from')}</Label>
            <Input
              id="funds-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="funds-to">{t('to')}</Label>
            <Input
              id="funds-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={() => void applyRange(from, to)} disabled={loading}>
            {loading ? t('loading') : t('applyRange')}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t('period', { from: overview.from, to: overview.to })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.key}
            href={buildDetailHref(stat.key)}
            className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`${stat.title} — ${t('viewDetail')}`}
          >
            <Card
              className={cn(
                'h-full ring-1 transition-all duration-200',
                stat.highlight
                  ? 'border-primary/30 bg-primary/[0.03] ring-primary/20 hover:border-primary/50 hover:shadow-sm'
                  : 'ring-border hover:border-primary/30 hover:bg-muted/30 hover:shadow-sm',
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-base font-medium">{stat.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs">{stat.hint}</CardDescription>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
                    {stat.badge ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                        {stat.badge}
                      </span>
                    ) : null}
                    <IconChevronRight
                      stroke={1.5}
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
                {stat.subValue ? (
                  <p className="mt-1 text-sm text-muted-foreground tabular-nums">{stat.subValue}</p>
                ) : null}
                <p className="mt-3 text-xs font-medium text-primary opacity-80 transition-opacity group-hover:opacity-100">
                  {t('viewDetail')}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
