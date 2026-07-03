import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformRolesGuard } from '../../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../../auth/decorators/platform-roles.decorator';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { PlatformSettingsService } from './platform-settings.service';

@Controller('platform/settings')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
@PlatformRoles('SUPER_ADMIN')
export class PlatformSettingsController {
  constructor(private readonly settingsService: PlatformSettingsService) {}

  
  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  
  @Patch()
  updateSettings(@Body() dto: UpdatePlatformSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }
}
