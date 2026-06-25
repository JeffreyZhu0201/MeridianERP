'use client';

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
  Input,
  Label,
  Select,
} from '@meridian/ui';
import { BindType, type GenerateQrResponse } from '@meridian/shared';
import { IconDownload, IconQrcode } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { DEFAULT_QR_EXPIRY_DAYS, downloadQrPng } from '@/lib/distributors';

interface QrDisplayProps {
  distributorId: string;
  token: string;
  initialQr?: GenerateQrResponse | null;
  isOwner: boolean;
  onGenerated?: () => void;
}

function clampExpiryDays(value: number): number {
  return Math.min(90, Math.max(1, value));
}

export function QrDisplay({
  distributorId,
  token,
  initialQr,
  isOwner,
  onGenerated,
}: QrDisplayProps) {
  const t = useTranslations('merchant.distributors.qr');
  const tBindType = useTranslations('merchant.distributors.bindType');
  const [bindType, setBindType] = useState<BindType>(initialQr?.bindType ?? BindType.MERCHANT);
  const [expiresInDays, setExpiresInDays] = useState(DEFAULT_QR_EXPIRY_DAYS);
  const [qr, setQr] = useState<GenerateQrResponse | null>(initialQr ?? null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  function bindTypeLabel(type: BindType): string {
    return tBindType(type);
  }

  async function generateQr() {
    if (!isOwner) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<GenerateQrResponse>(
        `/merchant/distributors/${distributorId}/qr`,
        {
          method: 'POST',
          body: JSON.stringify({ bindType, expiresInDays }),
        },
        token,
      );
      setQr(res);
      setBindType(res.bindType);
      onGenerated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('generateFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!qr?.url) return;
    await navigator.clipboard.writeText(qr.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownload() {
    if (!qr?.id) return;
    setDownloading(true);
    setError('');
    try {
      await downloadQrPng(distributorId, qr.id, token, qr.bindType);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('downloadFailed'));
    } finally {
      setDownloading(false);
    }
  }

  const isCustomerQr = qr?.bindType === BindType.CUSTOMER;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconQrcode className="size-5" stroke={1.5} />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {isOwner ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="bind-type">{t('audience')}</Label>
              <Select
                id="bind-type"
                value={bindType}
                onChange={(e) => setBindType(e.target.value as BindType)}
                disabled={loading}
              >
                <option value={BindType.MERCHANT}>{bindTypeLabel(BindType.MERCHANT)}</option>
                <option value={BindType.CUSTOMER}>{bindTypeLabel(BindType.CUSTOMER)}</option>
              </Select>
              <p className="text-xs text-muted-foreground">
                {bindType === BindType.CUSTOMER ? t('customerHint') : t('merchantHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires-in-days">{t('expiresInDays')}</Label>
              <Input
                id="expires-in-days"
                type="number"
                min={1}
                max={90}
                value={expiresInDays}
                onChange={(e) => {
                  const parsed = Number.parseInt(e.target.value, 10);
                  setExpiresInDays(
                    Number.isNaN(parsed) ? DEFAULT_QR_EXPIRY_DAYS : clampExpiryDays(parsed),
                  );
                }}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">{t('expiresHint')}</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t('ownerReadOnly')}</p>
        )}

        {qr ? (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{bindTypeLabel(qr.bindType)}</Badge>
              {isCustomerQr ? (
                <span className="text-xs text-muted-foreground">{t('storeBindUrl')}</span>
              ) : (
                <span className="text-xs text-muted-foreground">{t('merchantBindUrl')}</span>
              )}
            </div>
            <div className="flex justify-center rounded-lg border bg-white p-4">
              <QRCode value={qr.url} size={256} />
            </div>
            <p className="break-all font-mono text-xs text-muted-foreground">{qr.url}</p>
            <p className="text-xs text-muted-foreground">
              {t('expires', { date: new Date(qr.expiresAt).toLocaleString() })}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void copyLink()}>
                {copied ? t('copied') : t('copyLink')}
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleDownload()}
                disabled={downloading || !qr.id}
              >
                <IconDownload className="size-4" stroke={1.5} />
                {downloading ? t('downloading') : t('downloadPng')}
              </Button>
              {isOwner ? (
                <Button onClick={() => void generateQr()} disabled={loading}>
                  {loading ? t('generating') : t('generateNew')}
                </Button>
              ) : null}
            </div>
          </>
        ) : isOwner ? (
          <div className="text-center">
            <p className="mb-4 text-sm text-muted-foreground">{t('noQrYet')}</p>
            <Button onClick={() => void generateQr()} disabled={loading}>
              {loading
                ? t('generating')
                : t('generateQr', { bindType: bindTypeLabel(bindType) })}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
