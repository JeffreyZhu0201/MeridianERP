import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type {
  AiCallLogListQuery,
  AiPlatformStatus,
  PaginatedAiCallLogs,
} from '@meridian/shared';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformRolesGuard } from '../../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../../auth/decorators/platform-roles.decorator';
import { AiLlmService } from '../llm/ai-llm.service';
import { AnthropicLlmClient } from '../llm/anthropic-llm.client';
import { AiCallLogService } from './ai-call-log.service';

@Controller('platform/ai')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
@PlatformRoles('SUPER_ADMIN', 'FINANCE')
export class PlatformAiCallsController {
  constructor(
    private readonly aiCallLog: AiCallLogService,
    private readonly aiLlm: AiLlmService,
    private readonly anthropicLlm: AnthropicLlmClient,
  ) {}

  @Get('status')
  status(): AiPlatformStatus {
    const live = this.aiLlm.isLiveMode();
    return {
      live,
      model: live ? this.anthropicLlm.resolveModel() : undefined,
      baseUrl: live ? this.anthropicLlm.resolveBaseUrl() : undefined,
    };
  }

  @Get('calls')
  listCalls(@Query() query: AiCallLogListQuery): Promise<PaginatedAiCallLogs> {
    return this.aiCallLog.listForPlatform(query);
  }
}
