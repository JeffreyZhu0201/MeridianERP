'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  Button,
  Input,
  Label,
  Sheet,
  SheetFooter,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@meridian/ui';

import { apiFetch, type Product } from '@/lib/api';

interface ProductsTableProps {
  products: Product[];
  categories: Array<{ id: string; name: string }>;
  token: string;
}

export function ProductsTable({ products: initial, categories, token }: ProductsTableProps) {
  const router = useRouter();
  const t = useTranslations('merchant.catalog.products');
  const tCommon = useTranslations('common');
  const [products, setProducts] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    categoryId: '',
    isPublished: false,
    variantName: 'Default',
    sku: '',
    price: '',
  });
  const [error, setError] = useState('');

  function openCreate() {
    setEditing(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      categoryId: '',
      isPublished: false,
      variantName: 'Default',
      sku: '',
      price: '',
    });
    setOpen(true);
  }

  function openEdit(product: Product) {
    const variant = product.variants[0];
    setEditing(product);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      categoryId: product.categoryId ?? '',
      isPublished: product.isPublished,
      variantName: variant?.name ?? 'Default',
      sku: variant?.sku ?? '',
      price: variant ? String(variant.price) : '',
    });
    setOpen(true);
  }

  async function handleSave() {
    setError('');
    try {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        description: form.description || undefined,
        categoryId: form.categoryId || undefined,
        isPublished: form.isPublished,
        variants: [
          {
            name: form.variantName,
            sku: form.sku || form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
            price: parseFloat(form.price) || 0,
          },
        ],
      };

      if (editing) {
        await apiFetch(`/merchant/products/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }, token);
      } else {
        await apiFetch('/merchant/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        }, token);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('errors.saveFailed'));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return;
    await apiFetch(`/merchant/products/${id}`, { method: 'DELETE' }, token);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  }

  function formatPrice(price: string | number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
      Number(price),
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>{t('add')}</Button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl ring-1 ring-border p-12 text-center">
          <p className="text-muted-foreground">{t('empty')}</p>
          <Button className="mt-4" onClick={openCreate}>
            {t('emptyAction')}
          </Button>
        </div>
      ) : (
        <div className="rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('name')}</TableHead>
                <TableHead>{t('slug')}</TableHead>
                <TableHead>{t('category')}</TableHead>
                <TableHead>{t('price')}</TableHead>
                <TableHead className="text-right">{t('sellable')}</TableHead>
                <TableHead>{tCommon('status')}</TableHead>
                <TableHead className="text-right">{tCommon('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const variant = product.variants[0];
                return (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="font-mono text-xs">{product.slug}</TableCell>
                    <TableCell>{product.category?.name ?? '—'}</TableCell>
                    <TableCell>{variant ? formatPrice(variant.price) : '—'}</TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {variant ? variant.inventory : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isPublished ? 'default' : 'secondary'}>
                        {product.isPublished ? t('published') : t('draft')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(product)}>
                          {tCommon('edit')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          {tCommon('delete')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={editing ? t('editTitle') : t('addTitle')}
        footer={
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleSave}>{tCommon('save')}</Button>
          </SheetFooter>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{tCommon('name')}</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">{t('slug')}</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder={t('slugPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('description')}</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">{t('category')}</Label>
            <select
              id="categoryId"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm dark:border-border/40"
            >
              <option value="">{tCommon('none')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="size-4 rounded border border-border dark:border-border/40"
            />
            {t('published')}
          </label>
          <div className="border-t pt-4">
            <p className="mb-3 text-sm font-medium">{t('defaultVariant')}</p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="variantName">{t('variantName')}</Label>
                <Input
                  id="variantName"
                  value={form.variantName}
                  onChange={(e) => setForm({ ...form, variantName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">{t('sku')}</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="price">{t('price')}</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('sellableQuantity')}</Label>
                  <p
                    className="font-mono text-lg font-semibold tabular-nums"
                    aria-readonly="true"
                  >
                    {editing?.variants[0]?.inventory ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('syncedFromWarehouse')}{' '}
                    {form.sku ? (
                      <Link
                        href={`/inventory/stock?q=${encodeURIComponent(form.sku)}`}
                        className="text-primary hover:underline"
                      >
                        {t('manageStock')}
                      </Link>
                    ) : (
                      <Link href="/inventory/adjustments" className="text-primary hover:underline">
                        {t('adjustViaInventory')}
                      </Link>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </Sheet>
    </>
  );
}
