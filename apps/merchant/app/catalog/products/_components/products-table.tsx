'use client';

import { useRouter } from 'next/navigation';
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
    inventory: '0',
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
      inventory: '0',
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
      inventory: variant ? String(variant.inventory) : '0',
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
            inventory: parseInt(form.inventory, 10) || 0,
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
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
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
        <Button onClick={openCreate}>Add Product</Button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No products yet</p>
          <Button className="mt-4" onClick={openCreate}>
            Add your first product
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell>
                      <Badge variant={product.isPublished ? 'default' : 'secondary'}>
                        {product.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(product)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          Delete
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
        title={editing ? 'Edit Product' : 'Add Product'}
        footer={
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </SheetFooter>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="auto-generated from name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">None</option>
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
              className="size-4 rounded border-input"
            />
            Published
          </label>
          <div className="border-t pt-4">
            <p className="mb-3 text-sm font-medium">Default variant</p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="variantName">Variant name</Label>
                <Input
                  id="variantName"
                  value={form.variantName}
                  onChange={(e) => setForm({ ...form, variantName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inventory">Inventory</Label>
                  <Input
                    id="inventory"
                    type="number"
                    value={form.inventory}
                    onChange={(e) => setForm({ ...form, inventory: e.target.value })}
                  />
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
