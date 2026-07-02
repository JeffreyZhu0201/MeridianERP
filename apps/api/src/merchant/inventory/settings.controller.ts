import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { UpdateInventorySettingsDto } from './dto/inventory.dto';
import { MerchantInventoryService } from './merchant-inventory.service';

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
