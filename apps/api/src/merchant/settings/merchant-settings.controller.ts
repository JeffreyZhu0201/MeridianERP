import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { UpdateMerchantSettingsDto } from './dto/update-merchant-settings.dto';
import { MerchantSettingsService } from './merchant-settings.service';

@Controller('merchant/settings')
@UseGuards(MerchantAuthGuard)
export class MerchantSettingsController {
  constructor(private readonly settingsService: MerchantSettingsService) {}

  @Get()
  getSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.getSettings(user.tenantId!);
  }

  @Patch()
  updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMerchantSettingsDto,
  ) {
    return this.settingsService.updateSettings(user, dto);
  }
}
