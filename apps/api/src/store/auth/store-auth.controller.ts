/**
 * StoreAuthController - 商店认证控制器
 *
 * 处理商店消费者的认证请求，包括注册和登录。
 * 所有路由公开，无需认证即可访问（支持游客查看商店）。
 *
 * 路由结构：
 * - POST /store/:slug/auth/register - 消费者注册
 * - POST /store/:slug/auth/login - 消费者登录
 *
 * @controller StoreAuthController
 */
import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { StoreLoginDto, StoreRegisterDto } from './dto/store-auth.dto';
import { StoreAuthService } from './store-auth.service';

/**
 * 商店认证控制器
 * 提供消费者注册和登录的 HTTP 端点
 */
@Controller('store/:slug/auth')
export class StoreAuthController {
  /**
   * 构造函数 - 注入认证服务
   * @param authService - 商店认证服务
   */
  constructor(private readonly authService: StoreAuthService) {}

  /**
   * 消费者注册接口
   *
   * 功能：创建新的消费者账户
   * 公开接口：无需认证即可访问
   *
   * @route POST /store/:slug/auth/register
   * @param slug - 商户商店的 URL 标识
   * @param dto - 注册表单数据（email, password, firstName?, lastName?）
   * @returns 201 - 包含 accessToken 和 customer 基本信息
   * @throws ConflictException - 邮箱已被注册
   */
  @Public()
  @Post('register')
  @HttpCode(201)
  register(@Param('slug') slug: string, @Body() dto: StoreRegisterDto) {
    return this.authService.register(slug, dto);
  }

  /**
   * 消费者登录接口
   *
   * 功能：验证消费者凭据并返回 JWT 令牌
   * 公开接口：无需认证即可访问
   *
   * @route POST /store/:slug/auth/login
   * @param slug - 商户商店的 URL 标识
   * @param dto - 登录表单数据（email, password）
   * @returns 201 - 包含 accessToken 和 customer 基本信息
   * @throws UnauthorizedException - 邮箱不存在或密码错误
   */
  @Public()
  @Post('login')
  @HttpCode(201)
  login(@Param('slug') slug: string, @Body() dto: StoreLoginDto) {
    return this.authService.login(slug, dto);
  }
}
