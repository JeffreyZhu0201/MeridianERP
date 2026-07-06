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

import { apiFetch } from '@/lib/api';

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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<DiagnosisResult>(
        '/platform/ai/diagnosis',
        {
          method: 'POST',
          body: JSON.stringify({ query }),
        },
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

      {result ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('reportTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap font-sans">{result.report}</pre>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            {result.cards.map((card) => (
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
