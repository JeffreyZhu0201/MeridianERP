import { Injectable } from '@nestjs/common';
import type { AiCallMode, AiStreamEvent } from '@meridian/shared';
import { AiLlmService } from './ai-llm.service';
import {
  emitAdminInsightEvents,
  emitCrmFollowUpEvents,
  emitDiagnosisEvents,
  emitProductCopyEvents,
  emitReplenishmentEvents,
} from '../streaming/ai-stream-result-emitters';

@Injectable()
export class AiLlmStreamService {
  constructor(private readonly aiLlm: AiLlmService) {}

  resolveMode(): AiCallMode {
    return this.aiLlm.isLiveMode() ? 'LIVE' : 'MOCK';
  }

  started(feature: Extract<AiStreamEvent, { type: 'started' }>['feature']) {
    return {
      type: 'started' as const,
      feature,
      mode: this.resolveMode(),
    };
  }

  async *streamDiagnosis(
    query: string,
    toolRuns: Parameters<AiLlmService['synthesizeDiagnosis']>[1],
    actorUserId: string,
  ): AsyncGenerator<AiStreamEvent> {
    yield this.started('PLATFORM_DIAGNOSIS');
    const { result, callLogId } = await this.aiLlm.synthesizeDiagnosis(
      query,
      toolRuns,
      { actorUserId, actorType: 'PLATFORM' },
    );
    yield* emitDiagnosisEvents(result);
    yield { type: 'done', result, callLogId: callLogId ?? undefined };
  }

  async *streamAdminInsight(
    feature:
      | 'PLATFORM_WITHDRAWAL_INSIGHT'
      | 'PLATFORM_DELIVERY_INSIGHT'
      | 'PLATFORM_FUNDS_INSIGHT',
    context: Parameters<AiLlmService['suggestAdminInsight']>[0],
  ): AsyncGenerator<AiStreamEvent> {
    yield this.started(feature);
    const { result, callLogId } = await this.aiLlm.suggestAdminInsight(
      context,
      { actorType: 'PLATFORM' },
    );
    yield* emitAdminInsightEvents(result);
    yield { type: 'done', result, callLogId: callLogId ?? undefined };
  }

  async *streamReplenishment(
    context: Parameters<AiLlmService['suggestReplenishment']>[0],
    tenantId: string,
    actorUserId?: string,
  ): AsyncGenerator<AiStreamEvent> {
    yield this.started('MERCHANT_REPLENISHMENT');
    const { result, callLogId } = await this.aiLlm.suggestReplenishment(
      context,
      { tenantId, actorUserId, actorType: 'MERCHANT' },
    );
    yield* emitReplenishmentEvents(result);
    yield {
      type: 'done',
      result,
      callLogId: callLogId ?? undefined,
    };
  }

  async *streamProductCopy(
    context: Parameters<AiLlmService['suggestProductCopy']>[0],
    tenantId: string,
  ): AsyncGenerator<AiStreamEvent> {
    yield this.started('MERCHANT_PRODUCT_COPY');
    const { result, callLogId } = await this.aiLlm.suggestProductCopy(context, {
      tenantId,
      actorType: 'MERCHANT',
    });
    yield* emitProductCopyEvents(result);
    yield { type: 'done', result, callLogId: callLogId ?? undefined };
  }

  async *streamCrmFollowUp(
    context: Parameters<AiLlmService['suggestCrmFollowUp']>[0],
    tenantId: string,
  ): AsyncGenerator<AiStreamEvent> {
    yield this.started('MERCHANT_CRM_FOLLOW_UP');
    const { result, callLogId } = await this.aiLlm.suggestCrmFollowUp(context, {
      tenantId,
      actorType: 'MERCHANT',
    });
    yield* emitCrmFollowUpEvents(result);
    yield { type: 'done', result, callLogId: callLogId ?? undefined };
  }
}
