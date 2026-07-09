import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import { EnvService } from '../config/env.service';
import type {
  StorageProvider,
  StoragePutInput,
} from './storage-provider.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly env: EnvService) {}

  private basePath(): string {
    return this.env.get('MEDIA_LOCAL_PATH') ?? './uploads';
  }

  private publicBaseUrl(): string {
    return (
      this.env.get('MEDIA_PUBLIC_BASE_URL') ??
      'http://localhost:3001/api/v1/media/files'
    );
  }

  async put(input: StoragePutInput): Promise<void> {
    const filePath = path.join(this.basePath(), input.key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, input.buffer);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath(), key);
    await unlink(filePath).catch(() => undefined);
  }

  resolvePublicUrl(key: string): string {
    const encoded = key.split('/').map(encodeURIComponent).join('/');
    return `${this.publicBaseUrl().replace(/\/$/, '')}/${encoded}`;
  }
}
