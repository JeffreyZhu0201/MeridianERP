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

import { apiFetch } from '@/lib/api';

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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setError('');
    setLoading(true);
    try {
      const body = leadId ? { leadId } : { contactId };
      const data = await apiFetch<CrmFollowUpSuggestion>(
        '/merchant/crm/ai/follow-up',
        {
          method: 'POST',
          body: JSON.stringify(body),
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

        {result ? (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1 font-medium">{t('summary')}</p>
              <p className="whitespace-pre-wrap">{result.summary}</p>
            </div>

            {result.stageInsight ? (
              <div>
                <p className="text-muted-foreground mb-1 font-medium">{t('stageInsight')}</p>
                <p className="whitespace-pre-wrap">{result.stageInsight}</p>
              </div>
            ) : null}

            {result.nextSteps.length > 0 ? (
              <div>
                <p className="text-muted-foreground mb-2 font-medium">{t('nextSteps')}</p>
                <ol className="list-decimal space-y-1 pl-5">
                  {result.nextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : null}

            {result.talkingPoints.length > 0 ? (
              <div>
                <p className="text-muted-foreground mb-2 font-medium">{t('talkingPoints')}</p>
                <ul className="list-disc space-y-1 pl-5">
                  {result.talkingPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.risks && result.risks.length > 0 ? (
              <div>
                <p className="text-muted-foreground mb-2 font-medium">{t('risks')}</p>
                <ul className="text-destructive list-disc space-y-1 pl-5">
                  {result.risks.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
