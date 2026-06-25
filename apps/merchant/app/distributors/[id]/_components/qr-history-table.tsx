'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import { BindType, type QrHistoryEntry, type QrHistoryListResponse, type QrTokenStatus } from '@meridian/shared';
import { IconDownload } from '@tabler/icons-react';

import { downloadQrPng, fetchQrHistory } from '@/lib/distributors';

interface QrHistoryTableProps {
  distributorId: string;
  token: string;
  initialHistory?: QrHistoryListResponse | null;
  refreshKey?: number;
}

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

function statusVariant(status: QrTokenStatus): 'success' | 'secondary' | 'destructive' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'REVOKED') return 'destructive';
  return 'secondary';
}

export function QrHistoryTable({
  distributorId,
  token,
  initialHistory,
  refreshKey = 0,
}: QrHistoryTableProps) {
  const t = useTranslations('merchant.distributors.qrHistory');
  const tBindType = useTranslations('merchant.distributors.bindType');
  const tStatus = useTranslations('merchant.distributors.qrStatus');
  const tCommon = useTranslations('common');
  const [history, setHistory] = useState<QrHistoryListResponse | null>(initialHistory ?? null);
  const [page, setPage] = useState(initialHistory?.page ?? 1);
  const [bindTypeFilter, setBindTypeFilter] = useState<BindType | ''>('');
  const [loading, setLoading] = useState(!initialHistory);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchQrHistory(distributorId, token, {
        page,
        limit: PAGE_SIZE,
        bindType: bindTypeFilter || undefined,
      });
      setHistory(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [bindTypeFilter, distributorId, page, token, t]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, refreshKey]);

  async function handleDownload(entry: QrHistoryEntry) {
    setDownloadingId(entry.id);
    setError('');
    try {
      await downloadQrPng(distributorId, entry.id, token, entry.bindType);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('downloadFailed'));
    } finally {
      setDownloadingId(null);
    }
  }

  const items = history?.items ?? [];
  const total = history?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
        <CardTitle>{t('title')}</CardTitle>
        <Select
          aria-label={t('filterAria')}
          value={bindTypeFilter}
          onChange={(e) => {
            setBindTypeFilter(e.target.value as BindType | '');
            setPage(1);
          }}
          className="w-48"
          disabled={loading}
        >
          <option value="">{t('allAudiences')}</option>
          <option value={BindType.MERCHANT}>{tBindType(BindType.MERCHANT)}</option>
          <option value={BindType.CUSTOMER}>{tBindType(BindType.CUSTOMER)}</option>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {loading && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('audience')}</TableHead>
                  <TableHead>{tCommon('status')}</TableHead>
                  <TableHead>{t('created')}</TableHead>
                  <TableHead>{t('expires')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Badge variant="outline">{tBindType(entry.bindType)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(entry.status)}>{tStatus(entry.status)}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(entry.expiresAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleDownload(entry)}
                        disabled={downloadingId === entry.id}
                      >
                        <IconDownload className="size-4" stroke={1.5} />
                        {downloadingId === entry.id ? t('downloading') : t('png')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t('pageTotal', { page, totalPages, total })}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                {tCommon('previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                {tCommon('next')}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
