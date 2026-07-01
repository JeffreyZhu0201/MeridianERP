import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformDistributorsService } from './platform-distributors.service';

/**
 * 平台经销商控制器 - 提供经销商管理的 API 端点
 *
 * 端点：
 * GET /platform/distributors - 查询经销商列表
 * POST /platform/distributors - 创建经销商
 * GET /platform/distributors/:id - 获取经销商详情
 * PATCH /platform/distributors/:id - 更新经销商信息
 * POST /platform/distributors/:id/portal - 开通经销商门户
 * POST /platform/distributors/:id/invite-code - 创建邀请码
 * POST /platform/distributors/:id/invite-code/:codeId/revoke - 作废邀请码
 * GET /platform/distributors/:id/branches - 获取招募的分店
 *
 * 认证：需要 PlatformAuthGuard（平台管理员 JWT）
 */

@Controller('platform/distributors')
@UseGuards(PlatformAuthGuard)
export class PlatformDistributorsController {
  constructor(private readonly service: PlatformDistributorsService) {}

  /**
   * 查询经销商列表
   *
   * @returns 平台级经销商列表
   */
  @Get()
  list() {
    return this.service.list();
  }

  /**
   * 创建经销商
   *
   * @param dto - 经销商信息
   * @returns 创建的经销商
   */
  @Post()
  @HttpCode(201)
  create(
    @Body()
    dto: {
      name: string;
      email?: string;
      phone?: string;
      commissionRate: number;
      commissionType?: 'PERCENT' | 'FIXED';
    },
  ) {
    return this.service.create(dto);
  }

  /**
   * 获取经销商详情
   *
   * @param id - 经销商 ID
   * @returns 经销商详情（含邀请码）
   */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  /**
   * 更新经销商信息
   *
   * @param id - 经销商 ID
   * @param dto - 更新字段
   * @returns 更新后的经销商
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      email?: string;
      phone?: string;
      commissionRate?: number;
      commissionType?: 'PERCENT' | 'FIXED';
      isActive?: boolean;
    },
  ) {
    return this.service.update(id, dto);
  }

  /**
   * 开通经销商门户
   *
   * @param id - 经销商 ID
   * @param dto - 包含登录密码
   * @returns 开通结果
   */
  @Post(':id/portal')
  @HttpCode(200)
  enablePortal(
    @Param('id') id: string,
    @Body() dto: { password: string },
  ) {
    return this.service.enablePortal(id, dto.password);
  }

  /**
   * 创建商户招募邀请码
   *
   * @param id - 经销商 ID
   * @param dto - 包含过期天数（可选）
   * @returns 创建的邀请码
   */
  @Post(':id/invite-code')
  @HttpCode(201)
  createInviteCode(
    @Param('id') id: string,
    @Body() dto: { expiresInDays?: number },
  ) {
    return this.service.createInviteCode(id, dto.expiresInDays);
  }

  /**
   * 作废邀请码
   *
   * @param id - 经销商 ID
   * @param codeId - 邀请码 ID
   * @returns 作废后的邀请码
   */
  @Post(':id/invite-code/:codeId/revoke')
  @HttpCode(200)
  revokeInviteCode(
    @Param('id') id: string,
    @Param('codeId') codeId: string,
  ) {
    return this.service.revokeInviteCode(id, codeId);
  }

  /**
   * 获取经销商招募的分店列表
   *
   * @param id - 经销商 ID
   * @returns 分店业绩汇总
   */
  @Get(':id/branches')
  getBranches(@Param('id') id: string) {
    return this.service.getBranches(id);
  }
}
