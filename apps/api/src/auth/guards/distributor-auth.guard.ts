import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * 渠道经销商认证守卫
 *
 * @description
 * 此守卫用于保护渠道经销商（distributor）相关的 API 端点。渠道经销商是
 * MeridianERP 中的 B2B 角色，负责招募商户加入平台并获取佣金收益。
 *
 * ## JWT 验证流程
 * 1. 从 Authorization header 提取 Bearer token
 * 2. 使用 JWT_DISTRIBUTOR_SECRET 密钥验证 token 签名
 * 3. 验证 token 未过期
 * 4. 验证 token 的 aud 字段为 'distributor'
 * 5. 验证 token 中包含 tenantId
 * 6. 验证 token 中包含 DISTRIBUTOR 角色
 * 7. 验证通过后，将用户信息附加到请求
 *
 * ## 经销商特殊权限
 * 渠道经销商具有以下特殊权限：
 * - 招募新商户加入平台
 * - 查看直接招募商户的业绩
 * - 获取佣金收益（通过 CommissionLedger）
 * - 提现佣金余额
 *
 * @example
 * ```typescript
 * // 保护经销商业绩端点
 * @Controller('distributor')
 * @UseGuards(DistributorAuthGuard)
 * export class DistributorController {
 *   @Get('merchants')
 *   getMyMerchants(@CurrentUser() user: AuthenticatedUser) {
 *     // 获取该经销商招募的所有商户
 *     return this.distributorService.getMerchants(user.userId, user.tenantId);
 *   }
 * }
 * ```
 *
 * @see DistributorJwtStrategy 经销商 JWT 验证策略
 */
@Injectable()
export class DistributorAuthGuard extends AuthGuard('distributor-jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * 守卫激活逻辑
   *
   * @description
   * 检查端点是否公开，然后执行经销商 JWT 认证。
   * 经销商使用独立的 JWT 密钥（JWT_DISTRIBUTOR_SECRET）。
   *
   * @param context - 执行上下文
   * @returns 公开端点直接放行，否则执行 JWT 验证
   */
  canActivate(context: ExecutionContext) {
    // 获取 @Public 标记
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 公开端点：跳过认证
    if (isPublic) {
      return true;
    }

    // 经销商端点：执行 JWT 验证
    return super.canActivate(context);
  }
}
