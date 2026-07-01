import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AllocationOrderStatus } from '@prisma/client';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PlatformAllocationsService } from '../../platform/allocations/platform-allocations.service';

/**
 * 商户配额分配控制器 (MerchantAllocationsController)
 *
 * 提供商户配额分配相关 API：
 * - GET /merchant/allocations - 获取配额分配列表（支持状态筛选）
 * - POST /merchant/allocations/:id/confirm - 确认配额分配
 *
 * 配额分配由总部（Platform）发起，商户外确认。
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
@Controller('merchant/allocations')
@UseGuards(MerchantAuthGuard)
export class MerchantAllocationsController {
  constructor(private readonly allocationsService: PlatformAllocationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: AllocationOrderStatus,
  ) {
    return this.allocationsService.listMerchantAllocations(
      user.tenantId!,
      status,
    );
  }

  @Post(':id/confirm')
  @HttpCode(200)
  confirm(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.allocationsService.confirmAllocation(
      id,
      user.userId,
      user.tenantId!,
    );
  }
}
