'use client';

import { useRef, useState } from 'react';
import { IconStar, IconStarFilled, IconTrash, IconUpload } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@meridian/ui';
import type { MasterSkuImageInput } from '@meridian/shared';

import { apiUploadForm, type MediaAssetSummary } from '@/lib/api';

export interface ImageUploadItem extends MasterSkuImageInput {
  url: string;
  originalName?: string;
}

interface ImageUploadGalleryProps {
  token: string;
  items: ImageUploadItem[];
  onChange: (items: ImageUploadItem[]) => void;
}

export function ImageUploadGallery({
  token,
  items,
  onChange,
}: ImageUploadGalleryProps) {
  const t = useTranslations('admin.masterCatalog.content');
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    setError('');
    try {
      const uploaded: ImageUploadItem[] = [];
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append('file', file);
        const asset = await apiUploadForm<MediaAssetSummary>(
          '/platform/media/upload',
          formData,
          token,
        );
        uploaded.push({
          mediaAssetId: asset.id,
          url: asset.url,
          originalName: asset.originalName,
          sortOrder: items.length + uploaded.length,
          isPrimary: items.length === 0 && uploaded.length === 0,
          altText: file.name,
        });
      }
      onChange([...items, ...uploaded]);
    } catch {
      setError(t('uploadFailed'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function setPrimary(mediaAssetId: string) {
    onChange(
      items.map((item) => ({
        ...item,
        isPrimary: item.mediaAssetId === mediaAssetId,
      })),
    );
  }

  function removeItem(mediaAssetId: string) {
    const next = items.filter((item) => item.mediaAssetId !== mediaAssetId);
    if (next.length > 0 && !next.some((item) => item.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true };
    }
    onChange(next.map((item, index) => ({ ...item, sortOrder: index })));
  }

  function updateAltText(mediaAssetId: string, altText: string) {
    onChange(
      items.map((item) =>
        item.mediaAssetId === mediaAssetId ? { ...item, altText } : item,
      ),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <IconUpload className="mr-2 size-4" aria-hidden />
          {uploading ? t('uploading') : t('upload')}
        </Button>
        <p className="text-sm text-muted-foreground">{t('uploadHint')}</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('emptyImages')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.mediaAssetId}
              className="rounded-xl border border-border p-3 dark:border-border/40"
            >
              <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-muted/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.altText ?? item.originalName ?? 'product'}
                  className="size-full object-contain"
                />
              </div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={item.isPrimary ? 'default' : 'outline'}
                  onClick={() => setPrimary(item.mediaAssetId)}
                >
                  {item.isPrimary ? (
                    <IconStarFilled className="mr-1 size-4" aria-hidden />
                  ) : (
                    <IconStar className="mr-1 size-4" aria-hidden />
                  )}
                  {item.isPrimary ? t('primary') : t('setPrimary')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeItem(item.mediaAssetId)}
                >
                  <IconTrash className="size-4" aria-hidden />
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`alt-${item.mediaAssetId}`}>{t('altText')}</Label>
                <Input
                  id={`alt-${item.mediaAssetId}`}
                  value={item.altText ?? ''}
                  onChange={(event) =>
                    updateAltText(item.mediaAssetId, event.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
