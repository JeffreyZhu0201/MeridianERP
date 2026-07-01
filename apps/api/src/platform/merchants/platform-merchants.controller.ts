import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { RejectMerchantDto } from './dto/reject-merchant.dto';
import { ListMerchantsQueryDto } from './dto/list-merchants-query.dto';
import { PlatformMerchantsService } from './platform-merchants.service';

/**
 * 平台商户控制器 - 提供商户审批和管理的 API 端点
 *
 * 端点：
 * GET /platform/merchants - 分页查询商户列表
 * GET /platform/merchants/:id - 获取商户详情
 * POST /platform/merchants/:id/approve - 审批通过商户
 * POST /platform/merchants/:id/reject - 拒绝商户申请
 * PATCH /platform/merchants/:id/recruiter - 更新商户招募经销商
 *
 * 认证：需要 PlatformAuthGuard（平台管理员 JWT）
 */
@Controller('platform/merchants')
@UseGuards(PlatformAuthGuard)
export class PlatformMerchantsController {
  constructor(private readonly platformMerchantsService: PlatformMerchantsService) {}

  /**
   * 分页查询商户列表
   *
   * @param query - 查询参数（分页、状态筛选、搜索）
   * @returns 商户分页列表
   */
  @Get()
  list(@Query() query: ListMerchantsQueryDto) {
    return this.platformMerchantsService.list(query);
  }

  /**
   * 获取商户详情
   *
   * @param id - 商户 Profile ID
   * @returns 商户详情（含 CRM 汇总和经销商信息）
   */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.platformMerchantsService.getById(id);
  }

  /**
   * 审批通过商户
   *
   * @param id - 商户 Profile ID
   * @param dto - 可选，指定招募经销商
   * @returns 审批结果
   */
  @Post(':id/approve')
  @HttpCode(201)
  approve(
    @Param('id') id: string,
    @Body() dto: { recruitedByDistributorId?: string },
  ) {
    return this.platformMerchantsService.approve(id, dto);
  }

  /**
   * 拒绝商户申请
   *
   * @param id - 商户 Profile ID
   * @param dto - 拒绝原因
   * @returns 拒绝结果
   */
  @Post(':id/reject')
  @HttpCode(201)
  reject(@Param('id') id: string, @Body() dto: RejectMerchantDto) {
    return this.platformMerchantsService.reject(id, dto);
  }

  /**
   * 更新商户招募经销商
   *
   * @param id - 商户 Profile ID
   * @param user - 当前平台用户
   * @param dto - 新经销商 ID 和变更原因
   * @returns 更新结果
   */
  @Patch(':id/recruiter')
  updateRecruiter(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { recruitedByDistributorId: string | null; reason: string },
  ) {
    return this.platformMerchantsService.updateRecruiter(
      id,
      dto,
      user.userId,
    );
  }
}
