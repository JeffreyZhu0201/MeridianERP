'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Button,
  Input,
  Label,
  MarkdownContent,
  MarkdownEditor,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@meridian/ui';

import { apiFetch, type MasterSku } from '@/lib/api';
import {
  ImageUploadGallery,
  type ImageUploadItem,
} from '@/app/_components/image-upload-gallery';

interface MasterSkuEditorProps {
  sku: MasterSku;
  token: string;
}

function mapImages(sku: MasterSku): ImageUploadItem[] {
  return (sku.images ?? []).map((image) => ({
    mediaAssetId: image.mediaAssetId,
    url: image.url,
    altText: image.altText ?? undefined,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
  }));
}

export function MasterSkuEditor({ sku, token }: MasterSkuEditorProps) {
  const router = useRouter();
  const t = useTranslations('admin.masterCatalog');
  const tc = useTranslations('common');
  const tContent = useTranslations('admin.masterCatalog.content');

  const [name, setName] = useState(sku.name);
  const [onHand, setOnHand] = useState(String(sku.quantityOnHand));
  const [unitCost, setUnitCost] = useState(String(sku.unitCost));
  const [wholesalePrice, setWholesalePrice] = useState(String(sku.wholesalePrice));
  const [retailPrice, setRetailPrice] = useState(String(sku.retailPrice));
  const [flagshipPrice, setFlagshipPrice] = useState(String(sku.flagshipPrice));
  const [isActive, setIsActive] = useState(sku.isActive);
  const [description, setDescription] = useState(sku.description ?? '');
  const [shortDescription, setShortDescription] = useState(sku.shortDescription ?? '');
  const [images, setImages] = useState<ImageUploadItem[]>(() => mapImages(sku));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(
        `/platform/allocations/master-skus/${sku.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            description: description || null,
            shortDescription: shortDescription || null,
            quantityOnHand: Number(onHand),
            unitCost: Number(unitCost),
            wholesalePrice: Number(wholesalePrice),
            retailPrice: Number(retailPrice),
            flagshipPrice: Number(flagshipPrice),
            isActive,
            images: images.map((image, index) => ({
              mediaAssetId: image.mediaAssetId,
              sortOrder: index,
              altText: image.altText,
              isPrimary: image.isPrimary,
            })),
          }),
        },
        token,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('editSkuFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-muted-foreground">{sku.skuCode}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/inventory/master-catalog">{tContent('backToList')}</Link>
          </Button>
          <Button onClick={() => void handleSave()} disabled={submitting}>
            {submitting ? tc('saving') : tc('save')}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">{tContent('tabBasic')}</TabsTrigger>
          <TabsTrigger value="description">{tContent('tabDescription')}</TabsTrigger>
          <TabsTrigger value="images">{tContent('tabImages')}</TabsTrigger>
          <TabsTrigger value="preview">{tContent('tabPreview')}</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="sku-name">{t('form.skuName')}</Label>
            <Input id="sku-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="short-description">{tContent('shortDescription')}</Label>
            <Input
              id="short-description"
              value={shortDescription}
              maxLength={160}
              onChange={(e) => setShortDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="on-hand">{t('form.onHand')}</Label>
              <Input id="on-hand" type="number" min="0" value={onHand} onChange={(e) => setOnHand(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-cost">{t('form.unitCost')}</Label>
              <Input id="unit-cost" type="number" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wholesale">{t('form.wholesalePrice')}</Label>
              <Input id="wholesale" type="number" step="0.01" value={wholesalePrice} onChange={(e) => setWholesalePrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retail">{t('form.retailPrice')}</Label>
              <Input id="retail" type="number" step="0.01" value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flagship">{t('form.flagshipPrice')}</Label>
              <Input id="flagship" type="number" step="0.01" value={flagshipPrice} onChange={(e) => setFlagshipPrice(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="is-active">{t('form.isActive')}</Label>
              <p className="text-xs text-muted-foreground">{t('form.isActiveHint')}</p>
            </div>
            <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </TabsContent>

        <TabsContent value="description" className="space-y-4 pt-4">
          <MarkdownEditor
            value={description}
            onChange={setDescription}
            placeholder={tContent('descriptionPlaceholder')}
          />
        </TabsContent>

        <TabsContent value="images" className="pt-4">
          <ImageUploadGallery token={token} items={images} onChange={setImages} />
        </TabsContent>

        <TabsContent value="preview" className="space-y-6 pt-4">
          {shortDescription ? (
            <p className="text-sm text-muted-foreground">{shortDescription}</p>
          ) : null}
          {images.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {images.map((image) => (
                <div key={image.mediaAssetId} className="aspect-square overflow-hidden rounded-xl bg-muted/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={image.altText ?? name} className="size-full object-contain" />
                </div>
              ))}
            </div>
          ) : null}
          <MarkdownContent content={description} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
