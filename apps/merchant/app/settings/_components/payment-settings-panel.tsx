'use client';

import { useTranslations } from 'next-intl';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@meridian/ui';
import type { MerchantSettingsDto } from '@meridian/shared';

interface PaymentSettingsPanelProps {
  settings: Pick<MerchantSettingsDto, 'storeUrl' | 'stripeMode'>;
}

export function PaymentSettingsPanel({ settings }: PaymentSettingsPanelProps) {
  const t = useTranslations('merchant.settings');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('storePayments')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">{t('storeUrl')}</p>
          <p className="font-mono text-sm">{settings.storeUrl}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('stripeMode')}</p>
          <Badge variant={settings.stripeMode === 'live' ? 'default' : 'secondary'}>
            {settings.stripeMode === 'live' ? t('stripeLive') : t('stripeMock')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
