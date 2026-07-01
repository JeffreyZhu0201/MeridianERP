import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { DistributorLoginDto } from './dto/distributor-login.dto';
import { DistributorAuthService } from './distributor-auth.service';

/**
 * 渠道经销商认证控制器
 *
 * 该控制器处理经销商的身份验证请求，包括：
 * - 经销商登录（获取 JWT Token）
 *
 * 所有端点均为公开端点（无需认证即可访问），
 * 使用 @Public() 装饰器标记。
 */
@Controller('distributor/auth')
export class DistributorAuthController {
  constructor(private readonly authService: DistributorAuthService) {}

  /**
   * 经销商登录
   *
   * 验证经销商的邮箱和密码，验证成功后返回 JWT Token。
   *
   * 登录逻辑说明：
   * 1. 根据邮箱查找经销商记录（必须满足：portalEnabled=true, isActive=true）
   * 2. 如果是平台级经销商（tenantId=null），邮箱必须唯一
   * 3. 如果是商户级经销商，根据 tenantSlug 定位具体商户
   * 4. 验证密码哈希
   * 5. 更新最后登录时间
   * 6. 返回 JWT Token 和经销商基本信息
   *
   * @param dto - 登录表单数据，包含 email、password 和可选的 tenantSlug
   * @returns 包含 accessToken 和 distributor 基本信息的对象
   */
  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: DistributorLoginDto) {
    return this.authService.login(dto);
  }
}
