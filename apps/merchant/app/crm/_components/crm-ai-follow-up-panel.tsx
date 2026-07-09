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
import type { CrmFollowUpSuggestion } from '@meridian/shared';

import { streamAi } from '@/lib/ai-stream';

interface CrmAiFollowUpPanelProps {
  token: string;
  leadId?: string;
  contactId?: string;
}

export function CrmAiFollowUpPanel({
  token,
  leadId,
  contactId,
}: CrmAiFollowUpPanelProps) {
  const t = useTranslations('merchant.crm.ai');
  const [result, setResult] = useState<CrmFollowUpSuggestion | null>(null);
  const [streaming, setStreaming] = useState<CrmFollowUpSuggestion>({
    summary: '',
    nextSteps: [],
    talkingPoints: [],
    sources: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setError('');
    setLoading(true);
    try {
      const body = leadId ? { leadId } : { contactId };
      setStreaming({ summary: '', nextSteps: [], talkingPoints: [], sources: [] });
      await streamAi('/merchant/crm/ai/follow-up', body, token, (event) => {
        if (event.type === 'summary_delta') {
          setStreaming((current) => ({
            ...current,
            summary: current.summary + event.text,
          }));
        }
        if (event.type === 'next_step') {
          setStreaming((current) => ({
            ...current,
            nextSteps: [...current.nextSteps, event.text],
          }));
        }
        if (event.type === 'talking_point') {
          setStreaming((current) => ({
            ...current,
            talkingPoints: [...current.talkingPoints, event.text],
          }));
        }
        if (event.type === 'done') {
          setResult(event.result as CrmFollowUpSuggestion);
        }
        if (event.type === 'error') {
          throw new Error(event.message);
        }
      });
    } catch {
      setError(t('submitFailed'));
      setResult(null);
      setStreaming({ summary: '', nextSteps: [], talkingPoints: [], sources: [] });
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

        {(result || (loading && streaming.summary)) ? (
          <div className="space-y-4 text-sm">
            {(() => {
              const display = result ?? streaming;
              return (
                <>
            <div>
              <p className="text-muted-foreground mb-1 font-medium">{t('summary')}</p>
              <p className="whitespace-pre-wrap">
                {display.summary}
                {loading && !result ? '▍' : ''}
              </p>
            </div>

            {display.stageInsight ? (
              <div>
                <p className="text-muted-foreground mb-1 font-medium">{t('stageInsight')}</p>
                <p className="whitespace-pre-wrap">{display.stageInsight}</p>
              </div>
            ) : null}

            {display.nextSteps.length > 0 ? (
              <div>
                <p className="text-muted-foreground mb-2 font-medium">{t('nextSteps')}</p>
                <ol className="list-decimal space-y-1 pl-5">
                  {display.nextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : null}

            {display.talkingPoints.length > 0 ? (
              <div>
                <p className="text-muted-foreground mb-2 font-medium">{t('talkingPoints')}</p>
                <ul className="list-disc space-y-1 pl-5">
                  {display.talkingPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {display.risks && display.risks.length > 0 ? (
              <div>
                <p className="text-muted-foreground mb-2 font-medium">{t('risks')}</p>
                <ul className="text-destructive list-disc space-y-1 pl-5">
                  {display.risks.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              </div>
            ) : null}
                </>
              );
            })()}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
