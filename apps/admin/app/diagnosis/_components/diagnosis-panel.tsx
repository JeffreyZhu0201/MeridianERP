'use client';

import { useState } from 'react';
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
  Label,
  Textarea,
} from '@meridian/ui';
import type { DiagnosisCardStatus, DiagnosisResult } from '@meridian/shared';

import { streamAi } from '@/lib/ai-stream';

interface DiagnosisPanelProps {
  token: string;
}

function statusVariant(
  status: DiagnosisCardStatus,
): 'default' | 'secondary' | 'destructive' | 'warning' {
  if (status === 'normal') return 'default';
  if (status === 'warning') return 'warning';
  return 'destructive';
}

export function DiagnosisPanel({ token }: DiagnosisPanelProps) {
  const t = useTranslations('admin.diagnosis');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [streamingReport, setStreamingReport] = useState('');
  const [streamingCards, setStreamingCards] = useState<DiagnosisResult['cards']>(
    [],
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    setStreamingReport('');
    setStreamingCards([]);
    try {
      await streamAi(
        '/platform/ai/diagnosis',
        { query },
        token,
        (event) => {
          if (event.type === 'cards') {
            setStreamingCards(event.cards);
          }
          if (event.type === 'report_delta') {
            setStreamingReport((current) => current + event.text);
          }
          if (event.type === 'done') {
            setResult(event.result as DiagnosisResult);
          }
          if (event.type === 'error') {
            throw new Error(event.message);
          }
        },
      );
    } catch {
      setError(t('submitFailed'));
      setResult(null);
      setStreamingReport('');
      setStreamingCards([]);
    } finally {
      setLoading(false);
    }
  }

  const displayResult: DiagnosisResult | null =
    result ??
    (loading && (streamingReport || streamingCards.length > 0)
      ? { report: streamingReport, cards: streamingCards, sources: [] }
      : null);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="diagnosis-query">{t('queryLabel')}</Label>
          <Textarea
            id="diagnosis-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('queryPlaceholder')}
            rows={4}
            required
          />
          <p className="text-muted-foreground text-xs">{t('emptyHint')}</p>
        </div>
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? t('submitting') : t('submit')}
        </Button>
      </form>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {displayResult ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('reportTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap font-sans">
                {displayResult.report}
                {loading && !result ? '▍' : ''}
              </pre>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            {displayResult.cards.map((card) => (
              <Card key={`${card.domain}-${card.title}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <Badge variant={statusVariant(card.status)}>
                    {t(`cardStatus.${card.status}`)}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
