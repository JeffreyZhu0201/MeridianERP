'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@meridian/ui';
import { IconQrcode } from '@tabler/icons-react';

import { apiFetch, type QrResponse } from '@/lib/api';

interface QrDisplayProps {
  distributorId: string;
  token: string;
  initialQr?: QrResponse | null;
}

export function QrDisplay({ distributorId, token, initialQr }: QrDisplayProps) {
  const [qr, setQr] = useState<QrResponse | null>(initialQr ?? null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateQr() {
    setLoading(true);
    try {
      const res = await apiFetch<QrResponse>(
        `/merchant/distributors/${distributorId}/qr`,
        { method: 'POST' },
        token,
      );
      setQr(res);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconQrcode className="size-5" stroke={1.5} />
          QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {qr ? (
          <>
            <div className="flex justify-center rounded-lg border bg-white p-4">
              <QRCode value={qr.url} size={256} />
            </div>
            <p className="break-all font-mono text-xs text-muted-foreground">{qr.url}</p>
            <p className="text-xs text-muted-foreground">
              Expires {new Date(qr.expiresAt).toLocaleString()}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyLink}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button onClick={generateQr} disabled={loading}>
                Generate New QR
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-sm text-muted-foreground">No QR code generated yet</p>
            <Button onClick={generateQr} disabled={loading}>
              Generate QR
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
