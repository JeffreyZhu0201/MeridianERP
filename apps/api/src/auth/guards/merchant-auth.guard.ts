import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * 商户认证守卫
 *
 * @description
 * 此守卫用于保护商户（merchant）相关的 API 端点，验证商户用户的 JWT token。
 * 商户用户是 Merchandise ERP 中的核心角色之一，属于特定租户（tenant）。
 *
 * ## JWT 验证流程
 * 1. 从请求的 Authorization header 中提取 Bearer token
 * 2. 使用 JWT_MERCHANT_SECRET 密钥验证 token 签名（独立于其他角色的密钥）
 * 3. 验证 token 未过期
 * 4. 验证 token 的 aud 字段为 'merchant'
 * 5. 验证 token 中包含 tenantId（商户必须属于某个租户）
 * 6. 验证通过后，将用户信息（userId、aud、tenantId、roles）附加到请求
 *
 * ## 租户隔离
 * 商户用户的操作必须在租户上下文中执行：
 * - 每个商户属于一个 tenantId
 * - 所有数据查询必须包含 tenantId 条件
 * - 商户无法访问其他商户的数据
 *
 * @example
 * ```typescript
 * // 保护商户数据端点
 * @Controller('inventory')
 * @UseGuards(MerchantAuthGuard)
 * export class InventoryController {
 *   @Get('stock')
 *   getStock(@CurrentUser() user: AuthenticatedUser) {
 *     // user.tenantId 用于过滤该商户的库存数据
 *     return this.inventoryService.getStock(user.tenantId);
 *   }
 * }
 * ```
 *
 * @see MerchantJwtStrategy 商户 JWT 验证策略
 * @see MerchantOwnerGuard 商户所有者角色守卫（需单独添加）
 */
@Injectable()
export class MerchantAuthGuard extends AuthGuard('merchant-jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * 守卫激活逻辑
   *
   * @description
   * 首先检查端点是否标记为公开，然后执行商户 JWT 认证。
   * 商户认证使用独立的 JWT 密钥（JWT_MERCHANT_SECRET）。
   *
   * @param context - 执行上下文
   * @returns 公开端点直接放行，否则执行 JWT 验证
   */
  canActivate(context: ExecutionContext) {
    // 检查方法和类级别是否标记了 @Public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 公开端点：跳过认证
    if (isPublic) {
      return true;
    }

    // 商户端点：执行 JWT 验证（使用 MerchantJwtStrategy）
    return super.canActivate(context);
  }
}
