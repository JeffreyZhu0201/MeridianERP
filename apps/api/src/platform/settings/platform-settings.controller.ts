import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { PlatformSettingsService } from './platform-settings.service';

/**
 * 平台设置控制器 - 提供平台配置管理的 API 端点
 *
 * 端点：
 * GET /platform/settings - 获取平台设置
 * PATCH /platform/settings - 更新平台设置
 *
 * 认证：需要 PlatformAuthGuard（平台管理员 JWT）
 */
@Controller('platform/settings')
@UseGuards(PlatformAuthGuard)
export class PlatformSettingsController {
  constructor(private readonly settingsService: PlatformSettingsService) {}

  /**
   * 获取平台设置
   *
   * @returns 平台设置
   */
  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  /**
   * 更新平台设置
   *
   * @param dto - 更新字段
   * @returns 更新后的平台设置
   */
  @Patch()
  updateSettings(@Body() dto: UpdatePlatformSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }
}
