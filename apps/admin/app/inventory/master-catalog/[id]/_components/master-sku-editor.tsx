'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Button,
  DetailPageFrame,
  ImageUploadGallery,
  Input,
  Label,
  MarkdownContent,
  MarkdownEditor,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
  type ImageUploadItem,
} from '@meridian/ui';

import { apiFetch, apiUploadForm, type MasterSku, type MediaAssetSummary } from '@/lib/api';

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

function parseNonNegativeNumber(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number`);
  }
  return parsed;
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
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSubmitting(true);
    setError('');
    try {
      const quantityOnHand = parseNonNegativeNumber(onHand, t('form.onHand'));
      const parsedUnitCost = parseNonNegativeNumber(unitCost, t('form.unitCost'));
      const parsedWholesale = parseNonNegativeNumber(
        wholesalePrice,
        t('form.wholesalePrice'),
      );
      const parsedRetail = parseNonNegativeNumber(retailPrice, t('form.retailPrice'));
      const parsedFlagship = parseNonNegativeNumber(
        flagshipPrice,
        t('form.flagshipPrice'),
      );

      await apiFetch(
        `/platform/allocations/master-skus/${sku.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            description: description || null,
            shortDescription: shortDescription || null,
            quantityOnHand,
            unitCost: parsedUnitCost,
            wholesalePrice: parsedWholesale,
            retailPrice: parsedRetail,
            flagshipPrice: parsedFlagship,
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
      toast.success(tContent('saveSuccess'));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('editSkuFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const asset = await apiUploadForm<MediaAssetSummary>(
      '/platform/media/upload',
      formData,
      token,
    );
    return {
      id: asset.id,
      url: asset.url,
      originalName: asset.originalName,
    };
  }

  return (
    <DetailPageFrame
      title={name}
      description={sku.skuCode}
      backHref="/inventory/master-catalog"
      backLabel={tContent('backToList')}
      actions={
        <Button
          onClick={() => void handleSave()}
          disabled={submitting || uploadingImages}
        >
          {submitting ? tc('saving') : tc('save')}
        </Button>
      }
    >
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
              <Input id="unit-cost" type="number" min="0" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wholesale">{t('form.wholesalePrice')}</Label>
              <Input id="wholesale" type="number" min="0" step="0.01" value={wholesalePrice} onChange={(e) => setWholesalePrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retail">{t('form.retailPrice')}</Label>
              <Input id="retail" type="number" min="0" step="0.01" value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flagship">{t('form.flagshipPrice')}</Label>
              <Input id="flagship" type="number" min="0" step="0.01" value={flagshipPrice} onChange={(e) => setFlagshipPrice(e.target.value)} />
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
          <ImageUploadGallery
            items={images}
            onChange={setImages}
            onUpload={handleUpload}
            onUploadingChange={setUploadingImages}
            disabled={submitting}
          />
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
    </DetailPageFrame>
  );
}
