'use client';

import Link from 'next/link';
import { useState } from 'react';
import { IconSparkles } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@meridian/ui';
import type { ReplenishmentSuggestion } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface InventoryAiReplenishmentPanelProps {
  token: string;
}

function urgencyVariant(
  urgency: string,
): 'destructive' | 'warning' | 'secondary' {
  if (urgency === 'critical') return 'destructive';
  if (urgency === 'high') return 'warning';
  return 'secondary';
}

export function InventoryAiReplenishmentPanel({
  token,
}: InventoryAiReplenishmentPanelProps) {
  const t = useTranslations('merchant.inventory.ai');
  const [result, setResult] = useState<ReplenishmentSuggestion | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<ReplenishmentSuggestion>(
        '/merchant/inventory/ai/replenishment',
        { method: 'POST', body: JSON.stringify({}) },
        token,
      );
      setResult(data);
    } catch {
      setError(t('submitFailed'));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div className="flex items-center gap-2">
          <IconSparkles className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <Badge variant="secondary">{t('readonly')}</Badge>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={loading}
          onClick={handleGenerate}
        >
          {loading ? t('generating') : t('generate')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!result && !error ? (
          <p className="text-sm text-muted-foreground">{t('emptyHint')}</p>
        ) : null}

        {result ? (
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('summary')}
              </p>
              <p className="text-sm">{result.summary}</p>
            </div>

            {result.priorities.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('priorities')}
                </p>
                <ul className="space-y-2">
                  {result.priorities.map((item) => (
                    <li
                      key={item.variantId}
                      className="rounded-lg border border-border p-3 text-sm dark:border-border/40"
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge variant={urgencyVariant(item.urgency)}>
                          {t(`urgency.${item.urgency}`)}
                        </Badge>
                        <span className="font-mono text-xs">{item.sku}</span>
                        <span className="text-muted-foreground">
                          {t('suggestedQty', { qty: item.suggestedQty })}
                        </span>
                      </div>
                      <p>{item.rationale}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.recommendations.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('recommendations')}
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {result.recommendations.map((rec) => (
                    <li key={rec}>{rec}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex justify-end">
              <Link
                href="/inventory/procurement"
                className="inline-flex min-h-9 items-center rounded-full border border-border px-3 text-xs font-medium hover:bg-accent dark:border-border/40"
              >
                {t('reorderLink')}
              </Link>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
