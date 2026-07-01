import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { UpdateInventorySettingsDto } from './dto/inventory.dto';
import { MerchantInventoryService } from './merchant-inventory.service';

/**
 * 库存设置控制器 (MerchantInventorySettingsController)
 *
 * 提供库存设置 API：
 * - GET /merchant/inventory/settings - 获取库存设置
 * - PATCH /merchant/inventory/settings - 更新库存设置
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
@Controller('merchant/inventory/settings')
@UseGuards(MerchantAuthGuard)
export class MerchantInventorySettingsController {
  constructor(private readonly inventoryService: MerchantInventoryService) {}

  @Get()
  getSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.getSettings(user.tenantId!);
  }

  @Patch()
  updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateInventorySettingsDto,
  ) {
    return this.inventoryService.updateSettings(user, dto);
  }
}
