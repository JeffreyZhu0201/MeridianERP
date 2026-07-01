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
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import {
  AdjustmentListQueryDto,
  CreateStockAdjustmentDto,
  UpdateReorderThresholdDto,
} from './dto/inventory.dto';
import { MerchantInventoryService } from './merchant-inventory.service';

/**
 * 库存调整控制器 (MerchantAdjustmentsController)
 *
 * 提供库存调整相关 API：
 * - POST /merchant/inventory/adjustments - 创建库存调整
 * - GET /merchant/inventory/adjustments - 查询调整记录
 * - GET /merchant/inventory/alerts/low-stock - 低库存预警
 * - PATCH /merchant/inventory/variants/:variantId/reorder-threshold - 更新重订货阈值
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
@Controller('merchant/inventory')
@UseGuards(MerchantAuthGuard)
export class MerchantAdjustmentsController {
  constructor(private readonly inventoryService: MerchantInventoryService) {}

  @Post('adjustments')
  @HttpCode(201)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStockAdjustmentDto,
  ) {
    return this.inventoryService.createAdjustment(user, dto);
  }

  @Get('adjustments')
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: AdjustmentListQueryDto) {
    return this.inventoryService.listAdjustments(user.tenantId!, query);
  }

  @Get('alerts/low-stock')
  lowStock(@CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.lowStockAlerts(user.tenantId!);
  }

  @Patch('variants/:variantId/reorder-threshold')
  updateReorderThreshold(
    @CurrentUser() user: AuthenticatedUser,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateReorderThresholdDto,
  ) {
    return this.inventoryService.updateReorderThreshold(user, variantId, dto);
  }
}
