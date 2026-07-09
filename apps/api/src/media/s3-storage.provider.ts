import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { EnvService } from '../config/env.service';
import type {
  StorageProvider,
  StoragePutInput,
} from './storage-provider.interface';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private client: S3Client | null = null;

  constructor(private readonly env: EnvService) {}

  private getClient(): S3Client {
    if (!this.client) {
      const endpoint = this.env.get('S3_ENDPOINT');
      this.client = new S3Client({
        region: this.env.get('S3_REGION') ?? 'us-east-1',
        endpoint: endpoint || undefined,
        forcePathStyle: Boolean(endpoint),
        credentials: {
          accessKeyId: this.env.get('S3_ACCESS_KEY_ID') ?? '',
          secretAccessKey: this.env.get('S3_SECRET_ACCESS_KEY') ?? '',
        },
      });
    }
    return this.client;
  }

  async put(input: StoragePutInput): Promise<void> {
    const bucket = this.env.get('S3_BUCKET');
    if (!bucket) {
      throw new Error('S3_BUCKET is not configured');
    }
    await this.getClient().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.key,
        Body: input.buffer,
        ContentType: input.mimeType,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    const bucket = this.env.get('S3_BUCKET');
    if (!bucket) return;
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await this.getClient().send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
  }

  resolvePublicUrl(key: string): string {
    const base = (this.env.get('S3_PUBLIC_URL') ?? '').replace(/\/$/, '');
    if (!base) {
      throw new Error('S3_PUBLIC_URL is not configured');
    }
    return `${base}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }
}
