'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  EmptyState,
  Input,
  Label,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  formatMoney,
  toast,
} from '@meridian/ui';
import type { BranchProcurementCatalogItem, ProcurementReceivingAddress } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface CartLine {
  masterSkuId: string;
  quantity: number;
}

interface ProcurementShopProps {
  catalog: BranchProcurementCatalogItem[];
  addresses: ProcurementReceivingAddress[];
  token: string;
}

function defaultAddressId(addresses: ProcurementReceivingAddress[]) {
  if (addresses.length === 0) return '';
  return addresses.find((a) => a.isDefault)?.id ?? addresses[0]!.id;
}

export function ProcurementShop({ catalog, addresses, token }: ProcurementShopProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('merchant.inventory.procurement');
  const [cart, setCart] = useState<CartLine[]>(() => {
    const masterSkuId = searchParams.get('masterSkuId');
    if (!masterSkuId) return [];
    const qty = Math.max(1, Number(searchParams.get('qty') ?? '1') || 1);
    return [{ masterSkuId, quantity: qty }];
  });
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [receivingAddressId, setReceivingAddressId] = useState(() =>
    defaultAddressId(addresses),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const catalogMap = useMemo(
    () => new Map(catalog.map((item) => [item.id, item])),
    [catalog],
  );

  const cartTotal = cart.reduce((sum, line) => {
    const item = catalogMap.get(line.masterSkuId);
    if (!item) return sum;
    return sum + Number(item.wholesalePrice) * line.quantity;
  }, 0);

  function getQtyInput(id: string) {
    return quantities[id] ?? '1';
  }

  function addToCart(masterSkuId: string) {
    const qty = Math.max(1, parseInt(getQtyInput(masterSkuId), 10) || 1);
    setCart((prev) => {
      const existing = prev.find((l) => l.masterSkuId === masterSkuId);
      if (existing) {
        return prev.map((l) =>
          l.masterSkuId === masterSkuId ? { ...l, quantity: l.quantity + qty } : l,
        );
      }
      return [...prev, { masterSkuId, quantity: qty }];
    });
  }

  function updateCartQty(masterSkuId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((l) => l.masterSkuId !== masterSkuId));
      return;
    }
    setCart((prev) =>
      prev.map((l) => (l.masterSkuId === masterSkuId ? { ...l, quantity } : l)),
    );
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) {
      setError(t('emptyCart'));
      return;
    }
    if (addresses.length === 0 || !receivingAddressId) {
      setError(t('receivingAddressRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const order = await apiFetch<{ id: string }>(
        '/merchant/procurement/orders',
        {
          method: 'POST',
          body: JSON.stringify({
            note: note.trim() || undefined,
            receivingAddressId,
            lines: cart,
          }),
        },
        token,
      );
      toast.success(t('checkout'));
      router.push(`/inventory/procurement/${order.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('checkoutFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  const formatCNY = (value: number) => formatMoney(value, 'CNY', locale);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <h2 className="text-lg font-medium">{t('catalog')}</h2>
        {catalog.length === 0 ? (
          <EmptyState title={t('emptyCatalog')} />
        ) : (
          <div className="overflow-x-auto rounded-xl ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('product')}</TableHead>
                  <TableHead>{t('sku')}</TableHead>
                  <TableHead className="text-right">{t('wholesalePrice')}</TableHead>
                  <TableHead className="text-right">{t('hqStock')}</TableHead>
                  <TableHead>{t('quantity')}</TableHead>
                  <TableHead className="text-right">{t('addToCart')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalog.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="font-mono text-xs">{item.skuCode}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCNY(Number(item.wholesalePrice))}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {item.quantityOnHand}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        className="min-h-9 w-20"
                        value={getQtyInput(item.id)}
                        onChange={(e) =>
                          setQuantities((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addToCart(item.id)}
                      >
                        {t('addToCart')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <form onSubmit={handleCheckout} className="space-y-4 rounded-xl ring-1 ring-border p-4">
        <h2 className="text-lg font-medium">{t('cart')}</h2>
        {cart.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('emptyCart')}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {cart.map((line) => {
              const item = catalogMap.get(line.masterSkuId);
              if (!item) return null;
              return (
                <li key={line.masterSkuId} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.skuCode}</div>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    className="min-h-9 w-16"
                    value={line.quantity}
                    onChange={(e) =>
                      updateCartQty(line.masterSkuId, parseInt(e.target.value, 10) || 0)
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex justify-between border-t border-border pt-3 text-sm font-medium">
          <span>{t('total')}</span>
          <span className="tabular-nums">{formatCNY(cartTotal)}</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="procurement-address">{t('receivingAddress')}</Label>
            <Link href="/settings" className="text-xs text-primary hover:underline">
              {t('manageAddresses')}
            </Link>
          </div>
          {addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('receivingAddressRequired')}</p>
          ) : (
            <Select
              id="procurement-address"
              className="min-h-11"
              value={receivingAddressId}
              onChange={(e) => setReceivingAddressId(e.target.value)}
            >
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label} — {address.contactName} · {address.address}
                </option>
              ))}
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="procurement-note">{t('note')}</Label>
          <Textarea
            id="procurement-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('notePlaceholder')}
            rows={2}
          />
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button
          type="submit"
          className="min-h-11 w-full"
          disabled={submitting || cart.length === 0 || addresses.length === 0}
        >
          {submitting ? '…' : t('checkout')}
        </Button>
      </form>
    </div>
  );
}
