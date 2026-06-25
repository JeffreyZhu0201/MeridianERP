'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { BentoListHeader, Button, Input, Label, ListPageFrame } from '@meridian/ui';
import type { MerchantFundsSummary } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

const CURRENCY = 'CNY';

interface MerchantFundsPanelProps {
  initialSummary: MerchantFundsSummary;
  token: string;
  businessName?: string;
}

export function MerchantFundsPanel({
  initialSummary,
  token,
  businessName,
}: MerchantFundsPanelProps) {
  const t = useTranslations('merchant.funds');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(searchParams.get('from')?.slice(0, 10) ?? '');
  const [to, setTo] = useState(searchParams.get('to')?.slice(0, 10) ?? '');

  const formatMoney = (value: string | number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: CURRENCY,
      minimumFractionDigits: 2,
    }).format(Number(value));

  async function applyRange() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const data = await apiFetch<MerchantFundsSummary>(
        `/merchant/funds/summary${params.toString() ? `?${params}` : ''}`,
        {},
        token,
      );
      setSummary(data);
      const urlParams = new URLSearchParams();
      if (from) urlParams.set('from', from);
      if (to) urlParams.set('to', to);
      router.replace(`/funds?${urlParams.toString()}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ListPageFrame title={t('title')} description={t('description')}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label htmlFor="mf-from">{t('from')}</Label>
            <Input
              id="mf-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mf-to">{t('to')}</Label>
            <Input
              id="mf-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={applyRange} disabled={loading}>
            {loading ? t('loading') : t('applyRange')}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {t('period', { from: summary.from, to: summary.to })}
        </p>
        <p className="text-xs text-muted-foreground">{t('formulaHint')}</p>

        <BentoListHeader
          metrics={[
            { title: t('salesGmv'), value: formatMoney(summary.salesGmv) },
            { title: t('allocationCost'), value: formatMoney(summary.allocationCost) },
            {
              title: t('deliveryAllocationCost'),
              value: formatMoney(summary.deliveryAllocationCost),
            },
            {
              title: t('payableCommission'),
              value: formatMoney(summary.payableCommission),
            },
            { title: t('netPosition'), value: formatMoney(summary.netPosition) },
          ]}
        />
      </div>
    </ListPageFrame>
  );
}
