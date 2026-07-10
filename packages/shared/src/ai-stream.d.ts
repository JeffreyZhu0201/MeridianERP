import type { AdminAiInsight } from './admin-ai.js';
import type { AiCallMode, AiFeature } from './ai-logging.js';
import type { DiagnosisResult } from './ai.js';
import type { CrmFollowUpSuggestion } from './crm-ai.js';
import type { ProductCopySuggestion, ReplenishmentPriorityItem, ReplenishmentSuggestion } from './merchant-ai.js';
export interface AiStreamStartedEvent {
    type: 'started';
    feature: AiFeature;
    mode: AiCallMode;
}
export interface AiStreamErrorEvent {
    type: 'error';
    message: string;
}
export interface AiStreamDoneEvent {
    type: 'done';
    result: unknown;
    callLogId?: string;
    analysisId?: string;
}
export interface AiStreamReportDeltaEvent {
    type: 'report_delta';
    text: string;
}
export interface AiStreamCardsEvent {
    type: 'cards';
    cards: DiagnosisResult['cards'];
}
export interface AiStreamSummaryDeltaEvent {
    type: 'summary_delta';
    text: string;
}
export interface AiStreamFindingEvent {
    type: 'finding';
    text: string;
}
export interface AiStreamRecommendationEvent {
    type: 'recommendation';
    text: string;
}
export interface AiStreamRiskEvent {
    type: 'risk';
    text: string;
}
export interface AiStreamPriorityEvent {
    type: 'priority';
    item: ReplenishmentPriorityItem;
}
export interface AiStreamTitleDeltaEvent {
    type: 'title_delta';
    text: string;
}
export interface AiStreamDescriptionDeltaEvent {
    type: 'description_delta';
    text: string;
}
export interface AiStreamBulletEvent {
    type: 'bullet';
    text: string;
}
export interface AiStreamNextStepEvent {
    type: 'next_step';
    text: string;
}
export interface AiStreamTalkingPointEvent {
    type: 'talking_point';
    text: string;
}
export type AiStreamEvent = AiStreamStartedEvent | AiStreamErrorEvent | AiStreamDoneEvent | AiStreamReportDeltaEvent | AiStreamCardsEvent | AiStreamSummaryDeltaEvent | AiStreamFindingEvent | AiStreamRecommendationEvent | AiStreamRiskEvent | AiStreamPriorityEvent | AiStreamTitleDeltaEvent | AiStreamDescriptionDeltaEvent | AiStreamBulletEvent | AiStreamNextStepEvent | AiStreamTalkingPointEvent;
export type DiagnosisStreamResult = DiagnosisResult;
export type AdminInsightStreamResult = AdminAiInsight;
export type ReplenishmentStreamResult = ReplenishmentSuggestion;
export type ProductCopyStreamResult = ProductCopySuggestion;
export type CrmFollowUpStreamResult = CrmFollowUpSuggestion;
export interface ProcurementPrefillLine {
    masterSkuId: string;
    quantity: number;
    sku: string;
    name: string;
}
export interface ProcurementPrefillSkipped {
    variantId: string;
    reason: string;
}
export interface ProcurementPrefillResponse {
    analysisId: string;
    createdAt: string;
    lines: ProcurementPrefillLine[];
    skipped: ProcurementPrefillSkipped[];
}
