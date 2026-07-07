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
import type { ProductCopySuggestion } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface ProductCopyDraftForm {
  name: string;
  description: string;
  categoryId: string;
  sku: string;
  price: string;
}

interface ProductCopyAiPanelProps {
  token: string;
  productId?: string;
  draft: ProductCopyDraftForm;
  onAdoptTitle: (title: string) => void;
  onAdoptDescription: (description: string) => void;
}

export function ProductCopyAiPanel({
  token,
  productId,
  draft,
  onAdoptTitle,
  onAdoptDescription,
}: ProductCopyAiPanelProps) {
  const t = useTranslations('merchant.catalog.ai');
  const [result, setResult] = useState<ProductCopySuggestion | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adoptedTitle, setAdoptedTitle] = useState(false);
  const [adoptedDescription, setAdoptedDescription] = useState(false);

  async function handleGenerate() {
    setError('');
    setAdoptedTitle(false);
    setAdoptedDescription(false);
    setLoading(true);
    try {
      const body = {
        productId,
        draft: {
          name: draft.name || undefined,
          description: draft.description || undefined,
          categoryId: draft.categoryId || undefined,
          sku: draft.sku || undefined,
          price: draft.price ? Number(draft.price) : undefined,
        },
      };
      const data = await apiFetch<ProductCopySuggestion>(
        '/merchant/catalog/ai/product-copy',
        { method: 'POST', body: JSON.stringify(body) },
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
          <Badge variant="secondary">{t('manualSave')}</Badge>
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
          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border border-border p-3 dark:border-border/40">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('titleSuggestion')}
                  </p>
                  <p className="text-sm">{result.title}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onAdoptTitle(result.title);
                    setAdoptedTitle(true);
                  }}
                >
                  {adoptedTitle ? t('adoptTitleDone') : t('adoptTitle')}
                </Button>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border p-3 dark:border-border/40">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('descriptionSuggestion')}
                  </p>
                  <p className="whitespace-pre-wrap text-sm">{result.description}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onAdoptDescription(result.description);
                    setAdoptedDescription(true);
                  }}
                >
                  {adoptedDescription ? t('adoptDescriptionDone') : t('adoptDescription')}
                </Button>
              </div>
            </div>

            {result.bulletPoints && result.bulletPoints.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('bulletPoints')}
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {result.bulletPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">{t('saveReminder')}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
