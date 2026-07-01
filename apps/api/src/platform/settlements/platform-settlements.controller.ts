import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { ExportSettlementDto } from './dto/settlement.dto';
import { PlatformSettlementsService } from './platform-settlements.service';

/**
 * 平台结算控制器 - 提供佣金结算管理的 API 端点
 *
 * 端点：
 * GET /platform/settlements - 查询结算批次列表
 * GET /platform/settlements/ledger - 查询佣金账本
 * POST /platform/settlements/export - 导出结算批次
 *
 * 认证：需要 PlatformAuthGuard（平台管理员 JWT）
 */
@Controller('platform/settlements')
@UseGuards(PlatformAuthGuard)
export class PlatformSettlementsController {
  constructor(private readonly settlementsService: PlatformSettlementsService) {}

  /**
   * 分页查询结算批次列表
   *
   * @param page - 页码（可选，默认1）
   * @param limit - 每页数量（可选，默认20）
   * @returns 结算批次分页列表
   */
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.settlementsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * 查询佣金账本
   *
   * 支持按账本状态筛选（ACCRUED/SETTLED 等）。
   *
   * @param status - 账本状态筛选（可选）
   * @param page - 页码（可选，默认1）
   * @param limit - 每页数量（可选，默认50）
   * @returns 佣金账目分页列表
   */
  @Get('ledger')
  findLedger(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.settlementsService.findLedger(
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  /**
   * 导出结算批次
   *
   * 将指定时期的应计佣金导出为结算批次。
   * 导出后佣金状态变为 SETTLED。
   *
   * @param dto - 导出参数（periodStart、periodEnd 可选）
   * @returns 创建的结算批次详情
   */
  @Post('export')
  @HttpCode(201)
  export(@Body() dto: ExportSettlementDto) {
    return this.settlementsService.exportBatch(dto);
  }
}
