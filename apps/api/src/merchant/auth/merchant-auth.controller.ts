import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { MerchantLoginDto, MerchantRegisterDto } from './dto/merchant-auth.dto';
import { MerchantAuthService } from './merchant-auth.service';

/**
 * 商户认证控制器 (MerchantAuthController)
 *
 * 提供商户用户的注册和登录接口。
 * 路径前缀：/merchant/auth
 *
 * 公开接口（无需认证）：
 * - POST /merchant/auth/register - 商户注册
 * - POST /merchant/auth/login - 商户登录
 */
@Controller('merchant/auth')
export class MerchantAuthController {
  constructor(private readonly authService: MerchantAuthService) {}

  @Public()
  @Post('register')
  @HttpCode(201)
  register(@Body() dto: MerchantRegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(201)
  login(@Body() dto: MerchantLoginDto) {
    return this.authService.login(dto);
  }
}
