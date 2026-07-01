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
import { AllocationOrderStatus } from '@prisma/client';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PlatformAllocationsService } from './platform-allocations.service';

/**
 * 平台配额分配控制器 - 提供主SKU和配额分配管理的 API 端点
 *
 * 端点：
 * GET /platform/allocations/master-skus - 查询主SKU列表
 * POST /platform/allocations/master-skus - 创建主SKU
 * PATCH /platform/allocations/master-skus/:id - 更新主SKU
 * GET /platform/allocations - 查询配额分配单列表
 * POST /platform/allocations - 创建配额分配单
 * POST /platform/allocations/:id/issue - 发放配额分配单
 *
 * 认证：需要 PlatformAuthGuard（平台管理员 JWT）
 */
@Controller('platform/allocations')
@UseGuards(PlatformAuthGuard)
export class PlatformAllocationsController {
  constructor(private readonly service: PlatformAllocationsService) {}

  /**
   * 查询主SKU列表
   *
   * @param page - 页码（默认1）
   * @param limit - 每页数量（默认50）
   * @returns 主SKU分页列表
   */
  @Get('master-skus')
  listMasterSkus(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listMasterSkus(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  /**
   * 创建主SKU
   *
   * @param dto - SKU信息
   * @returns 创建的SKU
   */
  @Post('master-skus')
  @HttpCode(201)
  createMasterSku(
    @Body()
    dto: {
      skuCode: string;
      name: string;
      quantityOnHand?: number;
      unitCost: number;
      wholesalePrice: number;
      retailPrice: number;
    },
  ) {
    return this.service.createMasterSku(dto);
  }

  /**
   * 更新主SKU
   *
   * @param id - SKU ID
   * @param dto - 更新字段
   * @returns 更新后的SKU
   */
  @Patch('master-skus/:id')
  updateMasterSku(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      quantityOnHand?: number;
      unitCost?: number;
      wholesalePrice?: number;
      retailPrice?: number;
      isActive?: boolean;
    },
  ) {
    return this.service.updateMasterSku(id, dto);
  }

  /**
   * 查询配额分配单列表
   *
   * @param tenantId - 可选，按商户筛选
   * @param status - 可选，按状态筛选
   * @returns 配额分配单列表
   */
  @Get()
  list(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: AllocationOrderStatus,
  ) {
    return this.service.listAllocations(tenantId, status);
  }

  /**
   * 创建配额分配单
   *
   * @param dto - 分配单信息（商户ID、商品明细、备注）
   * @returns 创建的分配单
   */
  @Post()
  @HttpCode(201)
  create(
    @Body()
    dto: {
      tenantId: string;
      note?: string;
      lines: Array<{ masterSkuId: string; quantity: number }>;
    },
  ) {
    return this.service.createAllocation(dto.tenantId, dto.lines, dto.note);
  }

  /**
   * 发放配额分配单
   *
   * 将配额分配单发放给商户，状态变为 CONFIRMED。
   *
   * @param user - 当前平台用户
   * @param id - 分配单 ID
   * @returns 发放结果
   */
  @Post(':id/issue')
  @HttpCode(200)
  issue(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.issueAllocation(id, user.userId);
  }
}
