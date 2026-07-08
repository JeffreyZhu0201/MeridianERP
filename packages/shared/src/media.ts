export interface MasterSkuImageSummary {
  id: string;
  mediaAssetId: string;
  url: string;
  altText?: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface MasterSkuImageInput {
  mediaAssetId: string;
  sortOrder?: number;
  altText?: string;
  isPrimary?: boolean;
}

export interface MediaAssetSummary {
  id: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
  createdAt: string;
}

export interface ProductImageSummary {
  url: string;
  altText?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}
