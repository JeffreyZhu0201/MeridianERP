'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@meridian/ui';
import type {
  AiCallLogItem,
  AiPlatformStatus,
  PaginatedAiCallLogs,
} from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface AiCallsPanelProps
{
  token: string;
}

function modeVariant (
  mode: string,
): 'default' | 'secondary' | 'destructive' | 'warning'
{
  if (mode === 'LIVE') return 'default';
  if (mode === 'LIVE_FALLBACK_MOCK') return 'warning';
  return 'secondary';
}

function statusVariant (
  status: string,
): 'default' | 'secondary' | 'destructive' | 'warning'
{
  if (status === 'SUCCESS') return 'default';
  if (status === 'PARSE_FALLBACK') return 'warning';
  return 'destructive';
}

export function AiCallsPanel ({ token }: AiCallsPanelProps)
{
  const t = useTranslations('admin.aiCalls');
  const [status, setStatus] = useState<AiPlatformStatus | null>(null);
  const [logs, setLogs] = useState<AiCallLogItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () =>
  {
    setLoading(true);
    setError('');
    try {
      const [statusRes, logsRes] = await Promise.all([
        apiFetch<AiPlatformStatus>('/platform/ai/status', {}, token),
        apiFetch<PaginatedAiCallLogs>(
          '/platform/ai/calls?limit=50',
          {},
          token,
        ),
      ]);
      setStatus(statusRes);
      setLogs(logsRes.items);
    } catch {
      setError(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useEffect(() =>
  {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/diagnosis"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          { t('backToDiagnosis') }
        </Link>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={ loading }
          onClick={ () => void load() }
        >
          { t('refresh') }
        </Button>
      </div>

      { status ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{ t('statusTitle') }</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant={ status.live ? 'default' : 'secondary' }>
              { status.live ? t('liveMode') : t('mockMode') }
            </Badge>
            { status.model ? (
              <span className="text-muted-foreground">
                { t('model', { model: status.model }) }
              </span>
            ) : null }
            { status.baseUrl ? (
              <span className="truncate text-muted-foreground">
                { status.baseUrl }
              </span>
            ) : null }
          </CardContent>
        </Card>
      ) : null }

      { error ? (
        <Alert variant="destructive">
          <AlertDescription>{ error }</AlertDescription>
        </Alert>
      ) : null }

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ t('tableTitle') }</CardTitle>
        </CardHeader>
        <CardContent>
          { loading ? (
            <p className="text-sm text-muted-foreground">{ t('loading') }</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{ t('empty') }</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ t('columns.time') }</TableHead>
                  <TableHead>{ t('columns.feature') }</TableHead>
                  <TableHead>{ t('columns.tenant') }</TableHead>
                  <TableHead>{ t('columns.mode') }</TableHead>
                  <TableHead>{ t('columns.status') }</TableHead>
                  <TableHead className="text-right">
                    { t('columns.latency') }
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                { logs.map((row) => (
                  <TableRow key={ row.id }>
                    <TableCell className="whitespace-nowrap text-xs">
                      { new Date(row.createdAt).toLocaleString() }
                    </TableCell>
                    <TableCell className="text-xs">{ row.feature }</TableCell>
                    <TableCell className="text-xs">
                      { row.tenantName ?? row.tenantId ?? '—' }
                    </TableCell>
                    <TableCell>
                      <Badge variant={ modeVariant(row.mode) }>{ row.mode }</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ statusVariant(row.status) }>
                        { row.status }
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      { row.latencyMs != null ? `${row.latencyMs}ms` : '—' }
                    </TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          ) }
        </CardContent>
      </Card>
    </div>
  );
}
