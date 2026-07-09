import { Injectable, Logger } from '@nestjs/common';
import type {
  AdminAiInsight,
  CrmFollowUpSuggestion,
  DiagnosisResult,
  ProductCopySuggestion,
  ReplenishmentSuggestion,
} from '@meridian/shared';
import type {
  AiInvocationContext,
  AiLlmResult,
  RecordAiCallInput,
} from '../logging/ai-invocation.types';
import { EnvService } from '../../config/env.service';
import { CRM_FOLLOW_UP_SYSTEM_PROMPT } from '../../merchant/crm/ai/prompts/crm-follow-up-system-prompt';
import { PRODUCT_COPY_SYSTEM_PROMPT } from '../../merchant/catalog/ai/prompts/product-copy-system-prompt';
import { REPLENISHMENT_SYSTEM_PROMPT } from '../../merchant/inventory/ai/prompts/replenishment-system-prompt';
import { ADMIN_INSIGHT_SYSTEM_PROMPT } from '../insights/prompts/admin-insight-system-prompt';
import { DIAGNOSIS_SYSTEM_PROMPT } from '../diagnosis/prompts/diagnosis-system-prompt';
import { AiCallLogService } from '../logging/ai-call-log.service';
import { truncateText } from '../logging/ai-invocation.types';
import { AdminInsightMockClient } from './admin-insight-mock.client';
import type { AdminInsightContext } from './admin-insight.types';
import { AnthropicLlmClient } from './anthropic-llm.client';
import {
  buildDiagnosisResult,
  buildMockReport,
} from './diagnosis-result.builder';
import { CrmFollowUpMockClient } from './crm-follow-up-mock.client';
import type { CrmFollowUpContext } from './crm-follow-up.types';
import type {
  ProductCopyContext,
  ReplenishmentContext,
} from './merchant-ai.types';
import { MockLlmClient } from './mock-llm.client';
import { ProductCopyMockClient } from './product-copy-mock.client';
import { ReplenishmentMockClient } from './replenishment-mock.client';
import type { ToolRunResult } from './tool-run-result';

interface InvocationAttempt<T> {
  result: T;
  mode: RecordAiCallInput['mode'];
  status: RecordAiCallInput['status'];
  latencyMs?: number;
  errorMessage?: string;
  outputSummary: string;
}

@Injectable()
export class AiLlmService {
  private readonly logger = new Logger(AiLlmService.name);

  constructor(
    private readonly env: EnvService,
    private readonly mockLlm: MockLlmClient,
    private readonly anthropicLlm: AnthropicLlmClient,
    private readonly crmFollowUpMock: CrmFollowUpMockClient,
    private readonly adminInsightMock: AdminInsightMockClient,
    private readonly replenishmentMock: ReplenishmentMockClient,
    private readonly productCopyMock: ProductCopyMockClient,
    private readonly callLog: AiCallLogService,
  ) {}

  isLiveMode(): boolean {
    if (process.env.NODE_ENV === 'test') {
      return false;
    }

    const mode =
      this.env.get('AI_MODE') ?? this.env.get('AI_DIAGNOSIS_MODE', 'mock');
    if (mode !== 'live') {
      return false;
    }

    const apiKey = this.anthropicLlm.resolveApiKey();
    const baseUrl = this.anthropicLlm.resolveBaseUrl();

    if (!apiKey || !baseUrl) {
      return false;
    }

    if (apiKey.includes('...') || apiKey === 'change-me') {
      return false;
    }

    return true;
  }

  async synthesizeDiagnosis(
    query: string,
    toolRuns: ToolRunResult[],
    invocation?: AiInvocationContext,
  ): Promise<AiLlmResult<DiagnosisResult>> {
    const ctx: AiInvocationContext = {
      feature: 'PLATFORM_DIAGNOSIS',
      ...invocation,
      inputSummary:
        invocation?.inputSummary ?? truncateText(`query=${query}`, 200),
    };

    return this.invoke(ctx, async () => {
      if (this.isLiveMode()) {
        const started = Date.now();
        try {
          const result = await this.synthesizeDiagnosisLive(query, toolRuns);
          return {
            result,
            mode: 'LIVE',
            status: 'SUCCESS',
            latencyMs: Date.now() - started,
            outputSummary: truncateText(result.report, 500),
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown LLM error';
          this.logger.warn(
            `Live diagnosis LLM failed, falling back to mock: ${message}`,
          );
          const result = await this.mockLlm.synthesize(query, toolRuns);
          return {
            result,
            mode: 'LIVE_FALLBACK_MOCK',
            status: 'ERROR',
            latencyMs: Date.now() - started,
            errorMessage: message,
            outputSummary: truncateText(result.report, 500),
          };
        }
      }

      const result = await this.mockLlm.synthesize(query, toolRuns);
      return {
        result,
        mode: 'MOCK',
        status: 'SUCCESS',
        outputSummary: truncateText(result.report, 500),
      };
    });
  }

  async suggestCrmFollowUp(
    context: CrmFollowUpContext,
    invocation?: AiInvocationContext,
  ): Promise<AiLlmResult<CrmFollowUpSuggestion>> {
    const ctx: AiInvocationContext = {
      feature: 'MERCHANT_CRM_FOLLOW_UP',
      ...invocation,
      inputSummary:
        invocation?.inputSummary ?? `subjectType=${context.subjectType}`,
    };

    return this.invoke(ctx, async () => {
      if (this.isLiveMode()) {
        const started = Date.now();
        try {
          const live = await this.suggestCrmFollowUpLive(context);
          if (live) {
            return {
              result: live,
              mode: 'LIVE',
              status: 'SUCCESS',
              latencyMs: Date.now() - started,
              outputSummary: truncateText(live.summary, 500),
            };
          }
          const result = await this.crmFollowUpMock.suggest(context);
          return {
            result,
            mode: 'LIVE_FALLBACK_MOCK',
            status: 'PARSE_FALLBACK',
            latencyMs: Date.now() - started,
            outputSummary: truncateText(result.summary, 500),
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown LLM error';
          this.logger.warn(
            `Live CRM follow-up LLM failed, falling back to mock: ${message}`,
          );
          const result = await this.crmFollowUpMock.suggest(context);
          return {
            result,
            mode: 'LIVE_FALLBACK_MOCK',
            status: 'ERROR',
            latencyMs: Date.now() - started,
            errorMessage: message,
            outputSummary: truncateText(result.summary, 500),
          };
        }
      }

      const result = await this.crmFollowUpMock.suggest(context);
      return {
        result,
        mode: 'MOCK',
        status: 'SUCCESS',
        outputSummary: truncateText(result.summary, 500),
      };
    });
  }

  async suggestAdminInsight(
    context: AdminInsightContext,
    invocation?: AiInvocationContext,
  ): Promise<AiLlmResult<AdminAiInsight>> {
    const feature =
      context.scene === 'withdrawal'
        ? 'PLATFORM_WITHDRAWAL_INSIGHT'
        : context.scene === 'delivery-order'
          ? 'PLATFORM_DELIVERY_INSIGHT'
          : 'PLATFORM_FUNDS_INSIGHT';

    const ctx: AiInvocationContext = {
      feature,
      ...invocation,
      inputSummary: invocation?.inputSummary ?? `scene=${context.scene}`,
    };

    return this.invoke(ctx, async () => {
      if (this.isLiveMode()) {
        const started = Date.now();
        try {
          const live = await this.suggestAdminInsightLive(context);
          if (live) {
            return {
              result: live,
              mode: 'LIVE',
              status: 'SUCCESS',
              latencyMs: Date.now() - started,
              outputSummary: truncateText(live.summary, 500),
            };
          }
          const result = await this.adminInsightMock.suggest(context);
          return {
            result,
            mode: 'LIVE_FALLBACK_MOCK',
            status: 'PARSE_FALLBACK',
            latencyMs: Date.now() - started,
            outputSummary: truncateText(result.summary, 500),
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown LLM error';
          this.logger.warn(
            `Live admin insight LLM failed, falling back to mock: ${message}`,
          );
          const result = await this.adminInsightMock.suggest(context);
          return {
            result,
            mode: 'LIVE_FALLBACK_MOCK',
            status: 'ERROR',
            latencyMs: Date.now() - started,
            errorMessage: message,
            outputSummary: truncateText(result.summary, 500),
          };
        }
      }

      const result = await this.adminInsightMock.suggest(context);
      return {
        result,
        mode: 'MOCK',
        status: 'SUCCESS',
        outputSummary: truncateText(result.summary, 500),
      };
    });
  }

  async suggestReplenishment(
    context: ReplenishmentContext,
    invocation?: AiInvocationContext,
  ): Promise<AiLlmResult<ReplenishmentSuggestion>> {
    const ctx: AiInvocationContext = {
      feature: 'MERCHANT_REPLENISHMENT',
      tenantId: context.tenantId,
      ...invocation,
      inputSummary:
        invocation?.inputSummary ??
        `alerts=${context.alerts.length}, outbound=${context.recentOutbound?.length ?? 0}, pending=${context.pendingProcurement?.length ?? 0}`,
    };

    return this.invoke(ctx, async () => {
      if (this.isLiveMode()) {
        const started = Date.now();
        try {
          const live = await this.suggestReplenishmentLive(context);
          if (live) {
            return {
              result: live,
              mode: 'LIVE',
              status: 'SUCCESS',
              latencyMs: Date.now() - started,
              outputSummary: truncateText(
                `${live.summary} priorities=${live.priorities.length}`,
                500,
              ),
            };
          }
          const result = await this.replenishmentMock.suggest(context);
          return {
            result,
            mode: 'LIVE_FALLBACK_MOCK',
            status: 'PARSE_FALLBACK',
            latencyMs: Date.now() - started,
            outputSummary: truncateText(
              `${result.summary} priorities=${result.priorities.length}`,
              500,
            ),
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown LLM error';
          this.logger.warn(
            `Live replenishment LLM failed, falling back to mock: ${message}`,
          );
          const result = await this.replenishmentMock.suggest(context);
          return {
            result,
            mode: 'LIVE_FALLBACK_MOCK',
            status: 'ERROR',
            latencyMs: Date.now() - started,
            errorMessage: message,
            outputSummary: truncateText(
              `${result.summary} priorities=${result.priorities.length}`,
              500,
            ),
          };
        }
      }

      const result = await this.replenishmentMock.suggest(context);
      return {
        result,
        mode: 'MOCK',
        status: 'SUCCESS',
        outputSummary: truncateText(
          `${result.summary} priorities=${result.priorities.length}`,
          500,
        ),
      };
    });
  }

  async suggestProductCopy(
    context: ProductCopyContext,
    invocation?: AiInvocationContext,
  ): Promise<AiLlmResult<ProductCopySuggestion>> {
    const ctx: AiInvocationContext = {
      feature: 'MERCHANT_PRODUCT_COPY',
      ...invocation,
      inputSummary:
        invocation?.inputSummary ??
        `productId=${context.product?.id ?? 'draft'}, name=${context.product?.name ?? context.draft?.name ?? ''}`,
    };

    return this.invoke(ctx, async () => {
      if (this.isLiveMode()) {
        const started = Date.now();
        try {
          const live = await this.suggestProductCopyLive(context);
          if (live) {
            return {
              result: live,
              mode: 'LIVE',
              status: 'SUCCESS',
              latencyMs: Date.now() - started,
              outputSummary: truncateText(live.title, 500),
            };
          }
          const result = await this.productCopyMock.suggest(context);
          return {
            result,
            mode: 'LIVE_FALLBACK_MOCK',
            status: 'PARSE_FALLBACK',
            latencyMs: Date.now() - started,
            outputSummary: truncateText(result.title, 500),
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown LLM error';
          this.logger.warn(
            `Live product copy LLM failed, falling back to mock: ${message}`,
          );
          const result = await this.productCopyMock.suggest(context);
          return {
            result,
            mode: 'LIVE_FALLBACK_MOCK',
            status: 'ERROR',
            latencyMs: Date.now() - started,
            errorMessage: message,
            outputSummary: truncateText(result.title, 500),
          };
        }
      }

      const result = await this.productCopyMock.suggest(context);
      return {
        result,
        mode: 'MOCK',
        status: 'SUCCESS',
        outputSummary: truncateText(result.title, 500),
      };
    });
  }

  private async invoke<T>(
    ctx: AiInvocationContext,
    run: () => Promise<InvocationAttempt<T>>,
  ): Promise<AiLlmResult<T>> {
    const attempt = await run();
    const callLogId = await this.callLog.record({
      feature: ctx.feature!,
      mode: attempt.mode,
      status: attempt.status,
      tenantId: ctx.tenantId,
      actorUserId: ctx.actorUserId,
      actorType: ctx.actorType as 'PLATFORM' | 'MERCHANT' | undefined,
      model: this.isLiveMode() ? this.anthropicLlm.resolveModel() : undefined,
      latencyMs: attempt.latencyMs,
      errorMessage: attempt.errorMessage,
      inputSummary: ctx.inputSummary,
      outputSummary: attempt.outputSummary,
    });

    return {
      result: attempt.result,
      callLogId,
    };
  }

  private async synthesizeDiagnosisLive(
    query: string,
    toolRuns: ToolRunResult[],
  ): Promise<DiagnosisResult> {
    const toolContext = toolRuns
      .map(
        (run) =>
          `【${run.title}】\nfound=${run.result.found}\nsummary=${run.result.summary}\ndata=${JSON.stringify(run.result.data ?? null)}`,
      )
      .join('\n\n');

    const userMessage = [
      `用户问题：${query.trim()}`,
      '',
      '工具查询结果：',
      toolContext || '（无工具命中，请提示用户提供订单 ID 或分店 slug）',
    ].join('\n');

    const reportText = await this.anthropicLlm.completeMessages(
      DIAGNOSIS_SYSTEM_PROMPT,
      userMessage,
    );

    const report =
      reportText ||
      buildMockReport(
        query,
        toolRuns.map((run) => ({
          domain: run.domain,
          title: run.title,
          status: 'normal',
          value: run.result.summary,
        })),
      );

    return buildDiagnosisResult(query, toolRuns, report);
  }

  private async suggestCrmFollowUpLive(
    context: CrmFollowUpContext,
  ): Promise<CrmFollowUpSuggestion | null> {
    const userMessage = [
      '请根据以下 CRM 上下文生成跟进建议 JSON：',
      JSON.stringify(context, null, 2),
    ].join('\n');

    const text = await this.anthropicLlm.completeMessages(
      CRM_FOLLOW_UP_SYSTEM_PROMPT,
      userMessage,
    );

    return parseCrmFollowUpJson(text);
  }

  private async suggestAdminInsightLive(
    context: AdminInsightContext,
  ): Promise<AdminAiInsight | null> {
    const userMessage = [
      `场景：${context.scene}`,
      '请根据以下上下文生成运营解释 JSON：',
      JSON.stringify(context.data, null, 2),
    ].join('\n');

    const text = await this.anthropicLlm.completeMessages(
      ADMIN_INSIGHT_SYSTEM_PROMPT,
      userMessage,
    );

    return parseAdminInsightJson(text);
  }

  private async suggestReplenishmentLive(
    context: ReplenishmentContext,
  ): Promise<ReplenishmentSuggestion | null> {
    const userMessage = [
      '请根据以下库存补货上下文生成建议 JSON：',
      JSON.stringify(context, null, 2),
    ].join('\n');

    const text = await this.anthropicLlm.completeMessages(
      REPLENISHMENT_SYSTEM_PROMPT,
      userMessage,
    );

    return parseReplenishmentJson(text);
  }

  private async suggestProductCopyLive(
    context: ProductCopyContext,
  ): Promise<ProductCopySuggestion | null> {
    const userMessage = [
      '请根据以下商品上下文生成文案 JSON：',
      JSON.stringify(context, null, 2),
    ].join('\n');

    const text = await this.anthropicLlm.completeMessages(
      PRODUCT_COPY_SYSTEM_PROMPT,
      userMessage,
    );

    return parseProductCopyJson(text);
  }
}

function parseCrmFollowUpJson(text: string): CrmFollowUpSuggestion | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }

  try {
    const parsed = JSON.parse(match[0]) as CrmFollowUpSuggestion;
    if (!parsed.summary || !Array.isArray(parsed.nextSteps)) {
      return null;
    }
    return {
      summary: parsed.summary,
      nextSteps: parsed.nextSteps,
      talkingPoints: parsed.talkingPoints ?? [],
      stageInsight: parsed.stageInsight,
      risks: parsed.risks,
      sources: parsed.sources ?? [],
    };
  } catch {
    return null;
  }
}

function parseAdminInsightJson(text: string): AdminAiInsight | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }

  try {
    const parsed = JSON.parse(match[0]) as AdminAiInsight;
    if (!parsed.summary || !Array.isArray(parsed.findings)) {
      return null;
    }
    return {
      summary: parsed.summary,
      findings: parsed.findings,
      recommendations: parsed.recommendations ?? [],
      risks: parsed.risks,
      sources: parsed.sources ?? [],
    };
  } catch {
    return null;
  }
}

function parseReplenishmentJson(text: string): ReplenishmentSuggestion | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }

  try {
    const parsed = JSON.parse(match[0]) as ReplenishmentSuggestion;
    if (!parsed.summary || !Array.isArray(parsed.priorities)) {
      return null;
    }
    return {
      summary: parsed.summary,
      priorities: parsed.priorities,
      recommendations: parsed.recommendations ?? [],
      sources: parsed.sources ?? [],
    };
  } catch {
    return null;
  }
}

function parseProductCopyJson(text: string): ProductCopySuggestion | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }

  try {
    const parsed = JSON.parse(match[0]) as ProductCopySuggestion;
    if (!parsed.title || !parsed.description) {
      return null;
    }
    return {
      title: parsed.title,
      description: parsed.description,
      bulletPoints: parsed.bulletPoints,
      tone: parsed.tone,
      sources: parsed.sources ?? [],
    };
  } catch {
    return null;
  }
}
