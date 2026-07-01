import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { PlatformLoginDto } from './dto/platform-login.dto';
import { PlatformAuthService } from './platform-auth.service';

/**
 * 平台认证控制器 - 提供平台管理员认证的 API 端点
 *
 * 端点：
 * POST /platform/auth/login - 平台管理员登录（公开）
 *
 * 注意：登录接口无需认证（使用 @Public 装饰器）
 */
@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private readonly authService: PlatformAuthService) {}

  /**
   * 平台管理员登录
   *
   * @param dto - 登录凭证（邮箱 + 密码）
   * @returns JWT 和用户信息
   */
  @Public()
  @Post('login')
  @HttpCode(201)
  login(@Body() dto: PlatformLoginDto) {
    return this.authService.login(dto);
  }
}
