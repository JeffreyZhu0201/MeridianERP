'use client';

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
import type { AdminAiInsight } from '@meridian/shared';

import { streamAi } from '@/lib/ai-stream';

interface AdminAiInsightPanelProps {
  token: string;
  endpoint: string;
  body: Record<string, unknown>;
  compact?: boolean;
}

export function AdminAiInsightPanel({
  token,
  endpoint,
  body,
  compact = false,
}: AdminAiInsightPanelProps) {
  const t = useTranslations('admin.aiInsight');
  const [result, setResult] = useState<AdminAiInsight | null>(null);
  const [streaming, setStreaming] = useState<AdminAiInsight>({
    summary: '',
    findings: [],
    recommendations: [],
    risks: [],
    sources: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setError('');
    setLoading(true);
    setResult(null);
    setStreaming({ summary: '', findings: [], recommendations: [], risks: [], sources: [] });
    try {
      await streamAi(endpoint, body, token, (event) => {
        if (event.type === 'summary_delta') {
          setStreaming((current) => ({
            ...current,
            summary: current.summary + event.text,
          }));
        }
        if (event.type === 'finding') {
          setStreaming((current) => ({
            ...current,
            findings: [...current.findings, event.text],
          }));
        }
        if (event.type === 'recommendation') {
          setStreaming((current) => ({
            ...current,
            recommendations: [...current.recommendations, event.text],
          }));
        }
        if (event.type === 'risk') {
          setStreaming((current) => ({
            ...current,
            risks: [...(current.risks ?? []), event.text],
          }));
        }
        if (event.type === 'done') {
          setResult(event.result as AdminAiInsight);
        }
        if (event.type === 'error') {
          throw new Error(event.message);
        }
      });
    } catch {
      setError(t('submitFailed'));
      setResult(null);
      setStreaming({ summary: '', findings: [], recommendations: [], risks: [], sources: [] });
    } finally {
      setLoading(false);
    }
  }

  const displayResult = result ?? (loading ? streaming : null);

  const content = (
    <>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {displayResult ? (
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground mb-1 font-medium">{t('summary')}</p>
            <p className="whitespace-pre-wrap">
              {displayResult.summary}
              {loading && !result ? '▍' : ''}
            </p>
          </div>
          {displayResult.findings.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-2 font-medium">{t('findings')}</p>
              <ul className="list-disc space-y-1 pl-5">
                {displayResult.findings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {displayResult.recommendations.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-2 font-medium">{t('recommendations')}</p>
              <ul className="list-disc space-y-1 pl-5">
                {displayResult.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {displayResult.risks && displayResult.risks.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-2 font-medium">{t('risks')}</p>
              <ul className="text-destructive list-disc space-y-1 pl-5">
                {displayResult.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );

  if (compact) {
    return (
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IconSparkles className="size-4 text-primary" aria-hidden />
            <span className="text-sm font-medium">{t('title')}</span>
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
        </div>
        {content}
      </div>
    );
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
      <CardContent>{content}</CardContent>
    </Card>
  );
}
