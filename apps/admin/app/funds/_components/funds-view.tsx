'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, formatMoney, Input, Label } from '@meridian/ui';
import type { PlatformFundsSummary } from '@meridian/shared';

import { apiFetch } from '@/lib/api';
import { FundsSummaryCards } from './funds-summary-cards';

const CURRENCY = 'CNY';

interface FundsViewProps {
  initialSummary: PlatformFundsSummary;
  token: string;
}

export function FundsView({ initialSummary, token }: FundsViewProps) {
  const t = useTranslations('admin.funds');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(searchParams.get('from')?.slice(0, 10) ?? '');
  const [to, setTo] = useState(searchParams.get('to')?.slice(0, 10) ?? '');

  const formatCNY = (value: string | number) => formatMoney(value, CURRENCY, locale);

  async function applyRange() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const path = `/platform/funds/summary${params.toString() ? `?${params}` : ''}`;
      const data = await apiFetch<PlatformFundsSummary>(path, {}, token);
      setSummary(data);
      const urlParams = new URLSearchParams(searchParams.toString());
      if (from) urlParams.set('from', from);
      else urlParams.delete('from');
      if (to) urlParams.set('to', to);
      else urlParams.delete('to');
      router.replace(`/funds?${urlParams.toString()}`);
    } finally {
      setLoading(false);
    }
  }

  const maxTrend = Math.max(...(summary.gmvTrend?.map((d) => d.amount) ?? [1]), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label htmlFor="funds-from">{t('from')}</Label>
          <Input
            id="funds-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="funds-to">{t('to')}</Label>
          <Input
            id="funds-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-40"
          />
        </div>
        <Button onClick={applyRange} disabled={loading}>
          {loading ? t('loading') : t('applyRange')}
        </Button>
        <Link
          href="/settlements"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
        >
          {t('goToSettlements')}
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        {t('period', { from: summary.from, to: summary.to })}
      </p>

      <FundsSummaryCards summary={summary} formatMoney={formatCNY} />

      {summary.accruedAwaitingSettlement != null &&
      Number(summary.accruedAwaitingSettlement) > 0 ? (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <p className="text-sm">
              {t('accruedHint', {
                amount: formatCNY(summary.accruedAwaitingSettlement),
              })}
            </p>
            <Link
              href="/settlements"
              className="inline-flex h-8 items-center rounded-md border border-input px-3 text-sm hover:bg-muted"
            >
              {t('settleNow')}
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <Card className="ring-1 ring-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('gmvTrend')}</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.gmvTrend && summary.gmvTrend.length > 0 ? (
            <div className="flex h-32 items-end gap-1">
              {summary.gmvTrend.map((point) => (
                <div
                  key={point.date}
                  className="group flex flex-1 flex-col items-center gap-1"
                  title={`${point.date}: ${formatCNY(point.amount)}`}
                >
                  <div
                    className="w-full min-h-[2px] rounded-sm bg-primary/80 transition-colors group-hover:bg-primary"
                    style={{
                      height: `${Math.max(4, (point.amount / maxTrend) * 100)}%`,
                    }}
                  />
                  <span className="hidden text-[10px] text-muted-foreground sm:block">
                    {point.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('emptyTrend')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
