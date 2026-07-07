export type ReplenishmentUrgency = 'critical' | 'high' | 'medium';

export interface ReplenishmentPriorityItem {
  variantId: string;
  sku: string;
  urgency: ReplenishmentUrgency;
  suggestedQty: number;
  rationale: string;
}

export interface ReplenishmentSuggestion {
  summary: string;
  priorities: ReplenishmentPriorityItem[];
  recommendations: string[];
  sources: { type: string; ref: string }[];
}

export interface ProductCopyDraft {
  name?: string;
  description?: string;
  categoryId?: string;
  sku?: string;
  price?: number;
}

export interface ProductCopyRequest {
  productId?: string;
  draft?: ProductCopyDraft;
}

export interface ProductCopySuggestion {
  title: string;
  description: string;
  bulletPoints?: string[];
  tone?: string;
  sources: { type: string; ref: string }[];
}
