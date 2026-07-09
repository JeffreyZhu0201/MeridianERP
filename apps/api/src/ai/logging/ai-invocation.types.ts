import type { AiActorType, AiFeature } from '@meridian/shared';
import type { AiCallMode, AiCallStatus } from '@prisma/client';

export type { AiActorType, AiFeature };

export interface AiInvocationContext {
  feature?: AiFeature;
  tenantId?: string;
  actorUserId?: string;
  actorType?: AiActorType;
  inputSummary?: string;
}

export interface AiLlmResult<T> {
  result: T;
  callLogId: string | null;
}

export interface RecordAiCallInput {
  feature: AiFeature;
  mode: 'LIVE' | 'MOCK' | 'LIVE_FALLBACK_MOCK';
  status: 'SUCCESS' | 'ERROR' | 'PARSE_FALLBACK';
  tenantId?: string;
  actorUserId?: string;
  actorType?: AiActorType;
  model?: string;
  latencyMs?: number;
  errorMessage?: string;
  inputSummary?: string;
  outputSummary?: string;
}

export function truncateText(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}…`;
}
