'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import QRCode from 'react-qr-code';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import type { DistributorInviteCodeRow } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface SharePanelProps {
  initialCodes: DistributorInviteCodeRow[];
  token: string;
}

export function SharePanel({ initialCodes, token }: SharePanelProps) {
  const router = useRouter();
  const t = useTranslations('distributor.share');
  const tc = useTranslations('common');
  const [codes, setCodes] = useState(initialCodes);
  const [latest, setLatest] = useState<DistributorInviteCodeRow | null>(
    initialCodes.find((c) => !c.revokedAt) ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const created = await apiFetch<DistributorInviteCodeRow>(
        '/distributor/me/invite-codes',
        { method: 'POST', body: JSON.stringify({}) },
        token,
      );
      setLatest(created);
      setCodes((prev) => [created, ...prev]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('generateFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(codeId: string) {
    setError('');
    try {
      const updated = await apiFetch<DistributorInviteCodeRow>(
        `/distributor/me/invite-codes/${codeId}/revoke`,
        { method: 'POST' },
        token,
      );
      setCodes((prev) => prev.map((c) => (c.id === codeId ? updated : c)));
      if (latest?.id === codeId) setLatest(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('revokeFailed'));
    }
  }

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{t('title')}</CardTitle>
          <Button onClick={() => void handleGenerate()} disabled={loading}>
            {loading ? t('generating') : t('generate')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('description')}</p>
          {latest ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 rounded-lg border bg-white p-6 dark:bg-background">
                <QRCode value={latest.url} size={200} />
                <span className="font-mono text-lg tracking-widest">{latest.code}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input readOnly value={latest.url} className="font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={() => void handleCopy(latest.url)}>
                  {copied ? t('copied') : t('copyLink')}
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState title={t('noActiveCode')} description={t('noActiveCodeHint')} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('history')}</CardTitle>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <EmptyState title={t('emptyHistory')} />
          ) : (
            <div className="rounded-xl ring-1 ring-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('code')}</TableHead>
                    <TableHead>{t('uses')}</TableHead>
                    <TableHead>{tc('status')}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono">{code.code}</TableCell>
                      <TableCell>{code.useCount}</TableCell>
                      <TableCell>
                        {code.revokedAt ? (
                          <Badge variant="destructive">{t('revoked')}</Badge>
                        ) : (
                          <Badge variant="secondary">{tc('active')}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!code.revokedAt ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleRevoke(code.id)}
                          >
                            {t('revoke')}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
