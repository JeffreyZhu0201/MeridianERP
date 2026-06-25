'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
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
import { CommissionType, type QrHistoryListResponse } from '@meridian/shared';

import { type Binding, type Distributor } from '@/lib/api';
import { QrDisplay } from './qr-display';
import { QrHistoryTable } from './qr-history-table';
import { PortalAccessCard } from './portal-access-card';

interface OverviewPanelProps {
  distributor: Distributor;
  bindings: Binding[];
  token: string;
  isOwner: boolean;
  initialQrHistory?: QrHistoryListResponse | null;
}

export function OverviewPanel({
  distributor,
  bindings,
  token,
  isOwner,
  initialQrHistory,
}: OverviewPanelProps) {
  const t = useTranslations('merchant.distributors.overview');
  const tCommon = useTranslations('common');
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('commissionSettings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t('rate')}:</span>{' '}
              {distributor.commissionRate}
              {distributor.commissionType === CommissionType.PERCENT ? '%' : t('fixedSuffix')}
            </p>
            <p>
              <span className="text-muted-foreground">{t('type')}:</span> {distributor.commissionType}
            </p>
            <p>
              <span className="text-muted-foreground">{t('status')}:</span>{' '}
              {distributor.isActive ? tCommon('active') : tCommon('inactive')}
            </p>
          </CardContent>
        </Card>

        <PortalAccessCard distributor={distributor} token={token} isOwner={isOwner} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <QrDisplay
          distributorId={distributor.id}
          token={token}
          isOwner={isOwner}
          onGenerated={() => setHistoryRefreshKey((key) => key + 1)}
        />
      </div>

      <QrHistoryTable
        distributorId={distributor.id}
        token={token}
        initialHistory={initialQrHistory}
        refreshKey={historyRefreshKey}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('bindings')}</CardTitle>
        </CardHeader>
        <CardContent>
          {bindings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('bindingsEmpty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('bindType')}</TableHead>
                  <TableHead>{t('boundAt')}</TableHead>
                  <TableHead>{t('linkedLead')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bindings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.bindableType}</TableCell>
                    <TableCell>{new Date(b.boundAt).toLocaleString()}</TableCell>
                    <TableCell>{b.lead?.title ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
