'use client';

import { useRef, useState } from 'react';
import {
  IconArrowDown,
  IconArrowUp,
  IconStar,
  IconStarFilled,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import type { MasterSkuImageInput } from '@meridian/shared';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export interface ImageUploadItem extends MasterSkuImageInput {
  url: string;
  originalName?: string;
}

export interface ImageUploadResult {
  id: string;
  url: string;
  originalName?: string;
}

export interface ImageUploadGalleryProps {
  items: ImageUploadItem[];
  onChange: (items: ImageUploadItem[]) => void;
  onUpload: (file: File) => Promise<ImageUploadResult>;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
}

function withSortOrder(items: ImageUploadItem[]): ImageUploadItem[] {
  return items.map((item, index) => ({ ...item, sortOrder: index }));
}

export function ImageUploadGallery({
  items,
  onChange,
  onUpload,
  onUploadingChange,
  disabled = false,
}: ImageUploadGalleryProps) {
  const t = useTranslations('admin.masterCatalog.content');
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function setUploadState(next: boolean) {
    setUploading(next);
    onUploadingChange?.(next);
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length || disabled) return;
    setUploadState(true);
    setError('');
    try {
      const uploaded: ImageUploadItem[] = [];
      for (const file of Array.from(fileList)) {
        const asset = await onUpload(file);
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
      setUploadState(false);
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
    onChange(withSortOrder(next));
  }

  function moveItem(mediaAssetId: string, direction: -1 | 1) {
    const index = items.findIndex((item) => item.mediaAssetId === mediaAssetId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(withSortOrder(next));
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
          disabled={disabled || uploading}
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || uploading}
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
          {items.map((item, index) => (
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
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={item.isPrimary ? 'default' : 'outline'}
                  disabled={disabled}
                  onClick={() => setPrimary(item.mediaAssetId)}
                >
                  {item.isPrimary ? (
                    <IconStarFilled className="mr-1 size-4" aria-hidden />
                  ) : (
                    <IconStar className="mr-1 size-4" aria-hidden />
                  )}
                  {item.isPrimary ? t('primary') : t('setPrimary')}
                </Button>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={disabled || index === 0}
                    aria-label={t('moveUp')}
                    onClick={() => moveItem(item.mediaAssetId, -1)}
                  >
                    <IconArrowUp className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={disabled || index === items.length - 1}
                    aria-label={t('moveDown')}
                    onClick={() => moveItem(item.mediaAssetId, 1)}
                  >
                    <IconArrowDown className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={disabled}
                    aria-label={t('removeImage')}
                    onClick={() => removeItem(item.mediaAssetId)}
                  >
                    <IconTrash className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`alt-${item.mediaAssetId}`}>{t('altText')}</Label>
                <Input
                  id={`alt-${item.mediaAssetId}`}
                  value={item.altText ?? ''}
                  disabled={disabled}
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
