'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  IconAddressBook,
  IconClipboardList,
  IconHeadset,
  IconMessages,
  IconReceiptTax,
  IconUsers,
  IconWritingSign,
} from '@tabler/icons-react';
import type { MerchantPluginCatalogItem, MerchantPluginCode } from '@meridian/shared';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@meridian/ui';

import { apiFetch } from '@/lib/api';

const PLUGIN_ICONS: Record<
  MerchantPluginCode,
  React.ComponentType<{ className?: string; stroke?: number }>
> = {
  crm: IconAddressBook,
  hrm: IconUsers,
  im: IconMessages,
  finance_tax: IconReceiptTax,
  oa: IconClipboardList,
  e_signature: IconWritingSign,
  customer_service: IconHeadset,
};

interface PluginMarketplaceProps {
  items: MerchantPluginCatalogItem[];
  isOwner: boolean;
  highlight?: string;
  token?: string;
}

export function PluginMarketplace({ items, isOwner, highlight, token }: PluginMarketplaceProps) {
  const t = useTranslations('merchant.plugins');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [catalog, setCatalog] = useState(items);

  useEffect(() => {
    if (!highlight) return;
    const el = document.getElementById(`plugin-${highlight}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [highlight]);

  function labelFor(code: MerchantPluginCode) {
    const map: Record<MerchantPluginCode, string> = {
      crm: t('items.crm.name'),
      hrm: t('items.hrm.name'),
      im: t('items.im.name'),
      finance_tax: t('items.finance_tax.name'),
      oa: t('items.oa.name'),
      e_signature: t('items.e_signature.name'),
      customer_service: t('items.customer_service.name'),
    };
    return map[code];
  }

  function descriptionFor(code: MerchantPluginCode) {
    const map: Record<MerchantPluginCode, string> = {
      crm: t('items.crm.description'),
      hrm: t('items.hrm.description'),
      im: t('items.im.description'),
      finance_tax: t('items.finance_tax.description'),
      oa: t('items.oa.description'),
      e_signature: t('items.e_signature.description'),
      customer_service: t('items.customer_service.description'),
    };
    return map[code];
  }

  async function toggleInstall(code: MerchantPluginCode, installed: boolean) {
    if (!isOwner) return;
    startTransition(async () => {
      try {
        if (installed) {
          await apiFetch(`/merchant/plugins/${code}/uninstall`, { method: 'DELETE' }, token);
          toast.success(t('uninstallSuccess'));
        } else {
          await apiFetch(`/merchant/plugins/${code}/install`, { method: 'POST' }, token);
          toast.success(t('installSuccess'));
        }
        const next = await apiFetch<{ items: MerchantPluginCatalogItem[] }>(
          '/merchant/plugins',
          {},
          token,
        );
        setCatalog(next.items);
        router.refresh();
      } catch {
        toast.error(t('actionFailed'));
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {!isOwner ? (
        <p className="col-span-full text-sm text-muted-foreground">{t('ownerOnlyHint')}</p>
      ) : null}
      {catalog.map((item) => {
        const Icon = PLUGIN_ICONS[item.code];
        const highlighted = highlight === item.code;
        return (
          <Card
            key={item.code}
            id={`plugin-${item.code}`}
            className={highlighted ? 'ring-2 ring-primary' : undefined}
          >
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-5" stroke={1.5} />
                </div>
                {item.installed ? <Badge variant="secondary">{t('installed')}</Badge> : null}
              </div>
              <div>
                <CardTitle className="text-base">{labelFor(item.code)}</CardTitle>
                <CardDescription className="mt-1">{descriptionFor(item.code)}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant={item.installed ? 'outline' : 'default'}
                className="min-h-11 w-full"
                disabled={!isOwner || pending}
                onClick={() => toggleInstall(item.code, item.installed)}
              >
                {item.installed ? t('uninstall') : t('install')}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
