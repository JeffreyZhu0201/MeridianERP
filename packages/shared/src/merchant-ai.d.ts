export type ReplenishmentUrgency = "critical" | "high" | "medium";
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
    sources: {
        type: string;
        ref: string;
    }[];
}
export interface ReplenishmentAnalysisResponse extends ReplenishmentSuggestion {
    analysisId: string;
    createdAt: string;
}
export interface ReplenishmentAnalysisHistoryItem {
    id: string;
    createdAt: string;
    summary: string;
    priorityCount: number;
    result: ReplenishmentSuggestion;
}
export interface PaginatedReplenishmentAnalysisHistory {
    items: ReplenishmentAnalysisHistoryItem[];
    total: number;
    page: number;
    limit: number;
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
    sources: {
        type: string;
        ref: string;
    }[];
}
