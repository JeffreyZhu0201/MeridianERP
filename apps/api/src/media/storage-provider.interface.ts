export interface StoragePutInput {
  key: string;
  buffer: Buffer;
  mimeType: string;
}

export interface StorageProvider {
  put(input: StoragePutInput): Promise<void>;
  delete(key: string): Promise<void>;
  resolvePublicUrl(key: string): string;
}
