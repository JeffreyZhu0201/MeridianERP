import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * 商店消费者认证守卫
 *
 * @description
 * 此守卫用于保护商店前端（store）相关的 API 端点，验证消费者（customer）的 JWT token。
 * 消费者是购物应用的用户，可以在商店中浏览商品、下单购物。
 *
 * ## JWT 验证流程
 * 1. 从 Authorization header 提取 Bearer token
 * 2. 使用 JWT_STORE_SECRET 密钥验证 token 签名
 * 3. 验证 token 未过期
 * 4. 验证 token 的 aud 字段为 'store'
 * 5. 验证 token 中包含 tenantId（商店属于特定商户租户）
 * 6. 验证通过后，将用户信息附加到请求
 *
 * ## 租户绑定
 * 商店消费者绑定到特定商户租户：
 * - 每个商店属于一个 tenantId（商户）
 * - 消费者只能在特定商店下单
 * - 订单数据通过 tenantId 与商户关联
 *
 * @example
 * ```typescript
 * // 保护商店订单端点
 * @Controller('orders')
 * @UseGuards(StoreAuthGuard)
 * export class OrderController {
 *   @Post()
 *   createOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
 *     // user.tenantId 确定订单属于哪个商店
 *     return this.orderService.create(user.userId, user.tenantId, dto);
 *   }
 * }
 * ```
 *
 * @see CustomerJwtStrategy 消费者 JWT 验证策略
 * @see OptionalStoreAuthGuard 可选认证守卫（允许匿名访问）
 */
@Injectable()
export class StoreAuthGuard extends AuthGuard('store-jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * 守卫激活逻辑
   *
   * @description
   * 检查端点是否公开，然后执行商店消费者 JWT 认证。
   * 消费者使用独立的 JWT 密钥（JWT_STORE_SECRET）。
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

    // 商店端点：执行 JWT 验证
    return super.canActivate(context);
  }
}
