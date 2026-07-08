import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { MediaAssetSummary } from '@meridian/shared';
import { EnvService } from '../config/env.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  detectImageMime,
  extensionForMime,
  isAllowedImageMime,
} from './media-validation';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import type { StorageProvider } from './storage-provider.interface';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
    private readonly localStorage: LocalStorageProvider,
    private readonly s3Storage: S3StorageProvider,
  ) {}

  private storage(): StorageProvider {
    const mode = this.env.get('MEDIA_STORAGE', 'local');
    return mode === 's3' ? this.s3Storage : this.localStorage;
  }

  private maxBytes(): number {
    const raw = this.env.get('MEDIA_MAX_BYTES', '5242880');
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5_242_880;
  }

  async uploadImage(
    file: Express.Multer.File,
    platformUserId: string,
  ): Promise<MediaAssetSummary> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File is required');
    }
    if (file.size > this.maxBytes()) {
      throw new BadRequestException('File exceeds size limit');
    }
    if (!isAllowedImageMime(file.mimetype)) {
      throw new BadRequestException('Unsupported image type');
    }
    const detected = detectImageMime(file.buffer);
    if (!detected || detected !== file.mimetype) {
      throw new BadRequestException('Invalid image content');
    }

    const ext = extensionForMime(detected);
    const storageKey = `platform/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
    const storage = this.storage();
    await storage.put({
      key: storageKey,
      buffer: file.buffer,
      mimeType: detected,
    });
    const url = storage.resolvePublicUrl(storageKey);

    const asset = await this.prisma.mediaAsset.create({
      data: {
        storageKey,
        url,
        mimeType: detected,
        sizeBytes: file.size,
        originalName: file.originalname || `upload.${ext}`,
        uploadedByPlatformUserId: platformUserId,
      },
    });

    return {
      id: asset.id,
      url: asset.url,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      originalName: asset.originalName,
      createdAt: asset.createdAt.toISOString(),
    };
  }

  async cleanupUnreferencedMediaAssets(mediaAssetIds: string[]): Promise<void> {
    if (mediaAssetIds.length === 0) return;

    const storage = this.storage();
    for (const id of mediaAssetIds) {
      const [skuRefs, productRefs] = await Promise.all([
        this.prisma.masterSkuImage.count({ where: { mediaAssetId: id } }),
        this.prisma.productImage.count({ where: { sourceMediaAssetId: id } }),
      ]);
      if (skuRefs > 0 || productRefs > 0) continue;

      const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
      if (!asset) continue;

      await storage.delete(asset.storageKey);
      await this.prisma.mediaAsset.delete({ where: { id } });
    }
  }

  resolveMimeFromKey(key: string): string {
    const lower = key.toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    return 'application/octet-stream';
  }
}
