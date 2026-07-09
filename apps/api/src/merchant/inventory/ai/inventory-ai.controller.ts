import {
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type {
  PaginatedReplenishmentAnalysisHistory,
  ProcurementPrefillResponse,
  ReplenishmentAnalysisResponse,
} from '@meridian/shared';
import { MerchantAuthGuard } from '../../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/interfaces/jwt-payload.interface';
import { pipeAiStream } from '../../../ai/streaming/ai-sse.helper';
import { ReplenishmentAiService } from './replenishment-ai.service';

@Controller('merchant/inventory/ai')
@UseGuards(MerchantAuthGuard)
export class InventoryAiController {
  constructor(
    private readonly replenishmentAiService: ReplenishmentAiService,
  ) {}

  @Post('replenishment')
  @HttpCode(201)
  replenishment(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReplenishmentAnalysisResponse> {
    return this.replenishmentAiService.suggest(user.tenantId!, user.userId);
  }

  @Post('replenishment/stream')
  async replenishmentStream(
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    await pipeAiStream(
      res,
      this.replenishmentAiService.streamSuggest(user.tenantId!, user.userId),
    );
  }

  @Get('replenishment/procurement-prefill')
  async procurementPrefill(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ProcurementPrefillResponse | void> {
    const result = await this.replenishmentAiService.getProcurementPrefill(
      user.tenantId!,
    );
    if (!result) {
      res.status(204);
      return;
    }
    return result;
  }

  @Get('replenishment/latest')
  async latest(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ReplenishmentAnalysisResponse | void> {
    const result = await this.replenishmentAiService.getLatest(user.tenantId!);
    if (!result) {
      res.status(204);
      return;
    }
    return result;
  }

  @Get('replenishment/history')
  history(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedReplenishmentAnalysisHistory> {
    return this.replenishmentAiService.listHistory(
      user.tenantId!,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }
}
