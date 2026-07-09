'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { IconChevronDown, IconChevronRight, IconSparkles } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import
  {
    Alert,
    AlertDescription,
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from '@meridian/ui';
import type {
  PaginatedReplenishmentAnalysisHistory,
  ReplenishmentAnalysisHistoryItem,
  ReplenishmentAnalysisResponse,
  ReplenishmentSuggestion,
} from '@meridian/shared';

import { apiFetch } from '@/lib/api';
import { streamAi } from '@/lib/ai-stream';

interface InventoryAiReplenishmentPanelProps
{
  token: string;
}

function urgencyVariant (
  urgency: string,
): 'destructive' | 'warning' | 'secondary'
{
  if (urgency === 'critical') return 'destructive';
  if (urgency === 'high') return 'warning';
  return 'secondary';
}

function formatWhen (iso: string): string
{
  return new Date(iso).toLocaleString();
}

function SuggestionBody ({
  result,
  t,
}: {
  result: ReplenishmentSuggestion;
  t: ReturnType<typeof useTranslations<'merchant.inventory.ai'>>;
})
{
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          { t('summary') }
        </p>
        <p className="text-sm">{ result.summary }</p>
      </div>

      { result.priorities.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            { t('priorities') }
          </p>
          <ul className="space-y-2">
            { result.priorities.map((item) => (
              <li
                key={ item.variantId }
                className="rounded-lg border border-border p-3 text-sm dark:border-border/40"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant={ urgencyVariant(item.urgency) }>
                    { t(`urgency.${item.urgency}`) }
                  </Badge>
                  <span className="font-mono text-xs">{ item.sku }</span>
                  <span className="text-muted-foreground">
                    { t('suggestedQty', { qty: item.suggestedQty }) }
                  </span>
                </div>
                <p>{ item.rationale }</p>
              </li>
            )) }
          </ul>
        </div>
      ) : null }

      { result.recommendations.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            { t('recommendations') }
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm">
            { result.recommendations.map((rec) => (
              <li key={ rec }>{ rec }</li>
            )) }
          </ul>
        </div>
      ) : null }

      <div className="flex justify-end">
        <Link
          href="/inventory/procurement"
          className="inline-flex min-h-9 items-center rounded-full border border-border px-3 text-xs font-medium hover:bg-accent dark:border-border/40"
        >
          { t('reorderLink') }
        </Link>
      </div>
    </div>
  );
}

export function InventoryAiReplenishmentPanel ({
  token,
}: InventoryAiReplenishmentPanelProps)
{
  const t = useTranslations('merchant.inventory.ai');
  const [result, setResult] = useState<ReplenishmentAnalysisResponse | null>(
    null,
  );
  const [streamingSuggestion, setStreamingSuggestion] =
    useState<ReplenishmentSuggestion | null>(null);
  const [history, setHistory] = useState<ReplenishmentAnalysisHistoryItem[]>(
    [],
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadedFromHistory, setLoadedFromHistory] = useState(false);

  const loadLatest = useCallback(async () =>
  {
    const latest = await apiFetch<ReplenishmentAnalysisResponse>(
      '/merchant/inventory/ai/replenishment/latest',
      {},
      token,
    );
    if (latest) {
      setResult(latest);
      setLoadedFromHistory(true);
    }
  }, [token]);

  const loadHistory = useCallback(async () =>
  {
    const data = await apiFetch<PaginatedReplenishmentAnalysisHistory>(
      '/merchant/inventory/ai/replenishment/history?limit=10',
      {},
      token,
    );
    setHistory(data.items);
  }, [token]);

  useEffect(() =>
  {
    let cancelled = false;

    async function bootstrap ()
    {
      setInitialLoading(true);
      setError('');
      try {
        await Promise.all([loadLatest(), loadHistory()]);
      } catch {
        if (!cancelled) {
          setError(t('loadFailed'));
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    }

    void bootstrap();
    return () =>
    {
      cancelled = true;
    };
  }, [loadHistory, loadLatest, t]);

  async function handleGenerate ()
  {
    setError('');
    setLoading(true);
    setStreamingSuggestion({ summary: '', priorities: [], recommendations: [], sources: [] });
    try {
      await streamAi(
        '/merchant/inventory/ai/replenishment',
        {},
        token,
        (event) => {
          if (event.type === 'summary_delta') {
            setStreamingSuggestion((current) =>
              current
                ? { ...current, summary: current.summary + event.text }
                : { summary: event.text, priorities: [], recommendations: [], sources: [] },
            );
          }
          if (event.type === 'priority') {
            setStreamingSuggestion((current) =>
              current
                ? { ...current, priorities: [...current.priorities, event.item] }
                : { summary: '', priorities: [event.item], recommendations: [], sources: [] },
            );
          }
          if (event.type === 'recommendation') {
            setStreamingSuggestion((current) =>
              current
                ? {
                    ...current,
                    recommendations: [...current.recommendations, event.text],
                  }
                : { summary: '', priorities: [], recommendations: [event.text], sources: [] },
            );
          }
          if (event.type === 'done') {
            setResult(event.result as ReplenishmentAnalysisResponse);
            setStreamingSuggestion(null);
          }
          if (event.type === 'error') {
            throw new Error(event.message);
          }
        },
      );
      setLoadedFromHistory(false);
      setExpandedId(null);
      await loadHistory();
    } catch {
      setError(t('submitFailed'));
      setStreamingSuggestion(null);
    } finally {
      setLoading(false);
    }
  }

  function toggleHistoryItem (id: string)
  {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div className="flex items-center gap-2">
          <IconSparkles className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base">{ t('title') }</CardTitle>
          <Badge variant="secondary">{ t('readonly') }</Badge>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={ loading || initialLoading }
          onClick={ handleGenerate }
        >
          { loading
            ? t('generating')
            : result
              ? t('regenerate')
              : t('generate') }
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        { error ? (
          <Alert variant="destructive">
            <AlertDescription>{ error }</AlertDescription>
          </Alert>
        ) : null }

        { initialLoading ? (
          <p className="text-sm text-muted-foreground">{ t('loadingLatest') }</p>
        ) : null }

        { !initialLoading && !result && !error ? (
          <p className="text-sm text-muted-foreground">{ t('emptyHint') }</p>
        ) : null }

        { result && !initialLoading ? (
          <div className="space-y-3">
            { loadedFromHistory ? (
              <p className="text-xs text-muted-foreground">
                { t('latestLoaded', { when: formatWhen(result.createdAt) }) }
              </p>
            ) : null }
            <SuggestionBody result={ result } t={ t } />
          </div>
        ) : null }

        { loading && streamingSuggestion ? (
          <div className="space-y-3">
            <SuggestionBody result={ streamingSuggestion } t={ t } />
          </div>
        ) : null }

        { history.length > 0 ? (
          <div className="border-t border-border pt-4 dark:border-border/40">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              { t('history') }
            </p>
            <ul className="space-y-2">
              { history.map((item) =>
              {
                const expanded = expandedId === item.id;
                return (
                  <li
                    key={ item.id }
                    className="rounded-lg border border-border dark:border-border/40"
                  >
                    <button
                      type="button"
                      className="flex w-full items-start gap-2 p-3 text-left text-sm hover:bg-accent/50"
                      onClick={ () => toggleHistoryItem(item.id) }
                    >
                      { expanded ? (
                        <IconChevronDown className="mt-0.5 size-4 shrink-0" />
                      ) : (
                        <IconChevronRight className="mt-0.5 size-4 shrink-0" />
                      ) }
                      <span className="flex-1">
                        <span className="block text-xs text-muted-foreground">
                          { formatWhen(item.createdAt) }
                        </span>
                        <span className="block">{ item.summary }</span>
                        <span className="text-xs text-muted-foreground">
                          { t('historyMeta', { count: item.priorityCount }) }
                        </span>
                      </span>
                    </button>
                    { expanded ? (
                      <div className="border-t border-border p-3 dark:border-border/40">
                        <SuggestionBody result={ item.result } t={ t } />
                      </div>
                    ) : null }
                  </li>
                );
              }) }
            </ul>
          </div>
        ) : null }
      </CardContent>
    </Card>
  );
}
