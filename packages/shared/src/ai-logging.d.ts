export type AiFeature = "PLATFORM_DIAGNOSIS" | "PLATFORM_WITHDRAWAL_INSIGHT" | "PLATFORM_DELIVERY_INSIGHT" | "PLATFORM_FUNDS_INSIGHT" | "MERCHANT_REPLENISHMENT" | "MERCHANT_PRODUCT_COPY" | "MERCHANT_CRM_FOLLOW_UP";
export type AiCallMode = "LIVE" | "MOCK" | "LIVE_FALLBACK_MOCK";
export type AiCallStatus = "SUCCESS" | "ERROR" | "PARSE_FALLBACK";
export type AiActorType = "PLATFORM" | "MERCHANT";
export interface AiCallLogItem {
    id: string;
    feature: AiFeature;
    mode: AiCallMode;
    status: AiCallStatus;
    tenantId?: string | null;
    tenantName?: string | null;
    actorUserId?: string | null;
    actorType?: AiActorType | null;
    model?: string | null;
    latencyMs?: number | null;
    errorMessage?: string | null;
    inputSummary?: string | null;
    outputSummary?: string | null;
    createdAt: string;
}
export interface AiCallLogListQuery {
    page?: number;
    limit?: number;
    feature?: AiFeature;
    tenantId?: string;
    mode?: AiCallMode;
    from?: string;
    to?: string;
}
export interface PaginatedAiCallLogs {
    items: AiCallLogItem[];
    total: number;
    page: number;
    limit: number;
}
export interface AiPlatformStatus {
    live: boolean;
    model?: string;
    baseUrl?: string;
}
