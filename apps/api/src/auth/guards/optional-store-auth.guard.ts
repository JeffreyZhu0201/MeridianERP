import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

/**
 * 可选商店认证守卫
 *
 * @description
 * 此守卫允许端点同时被认证用户和匿名用户访问。与 StoreAuthGuard 不同，
 * 它不会因为缺少 token 或 token 无效而拒绝请求。
 *
 * ## 认证行为
 * | 场景 | 行为 | 结果 |
 * |------|------|------|
 * | 无 Authorization header | 放行 | @CurrentUser() 返回 undefined |
 * | 有 Bearer token 且有效 | 验证通过 | @CurrentUser() 返回用户信息 |
 * | 有 Bearer token 但无效 | 不抛错 | @CurrentUser() 返回 undefined |
 * | token 已过期 | 不抛错 | @CurrentUser() 返回 undefined |
 *
 * ## 适用场景
 * - 购物车：游客可以查看购物车，但下单需要登录
 * - 商品浏览：所有人可浏览，评论需要登录
 * - 促销页：展示促销信息，领取需要登录
 *
 * ## 重要说明
 * - 认证失败时不抛出异常，而是返回 undefined
 * - 控制器需要处理 @CurrentUser() 为 undefined 的情况
 * - 适合需要渐进式认证的功能
 *
 * @example
 * ```typescript
 * @Controller('cart')
 * @UseGuards(OptionalStoreAuthGuard)
 * export class CartController {
 *   @Get()
 *   getCart(@CurrentUser() user?: AuthenticatedUser) {
 *     if (!user) {
 *       // 游客购物车（可能存储在 cookie 或本地）
 *       return this.cartService.getGuestCart();
 *     }
 *     // 登录用户购物车
 *     return this.cartService.getUserCart(user.userId, user.tenantId);
 *   }
 * }
 * ```
 *
 * @see StoreAuthGuard 强制认证守卫
 */
@Injectable()
export class OptionalStoreAuthGuard extends AuthGuard('store-jwt') {
  /**
   * 守卫激活逻辑
   *
   * @description
   * 检查请求是否包含 Bearer token：
   * - 无 token：直接放行，允许匿名访问
   * - 有 token：调用父类执行标准 JWT 验证
   *
   * @param context - 执行上下文
   * @returns true 放行，或调用父类执行 JWT 验证
   */
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    const authHeader = request.headers.authorization;

    // 无 Bearer token：允许匿名访问
    if (!authHeader?.startsWith('Bearer ')) {
      return true;
    }

    // 有 token：执行标准 JWT 验证
    return super.canActivate(context);
  }

  /**
   * 处理认证结果
   *
   * @description
   * 重写父类的 handleRequest 方法，自定义错误处理：
   * - 认证失败（token 无效、过期等）：返回 undefined，不抛错
   * - 认证成功：返回用户对象
   *
   * @template TUser - 用户对象类型，默认 AuthenticatedUser
   * @param err - 认证过程中的错误（如 token 签名无效）
   * @param user - 认证成功的用户对象，或 false（无用户）
   * @returns 用户对象或 undefined（不抛错）
   */
  handleRequest<TUser = AuthenticatedUser>(
    err: Error | null,
    user: TUser | false,
  ): TUser | undefined {
    // 认证失败或无用户：返回 undefined，不阻止请求继续
    if (err || !user) {
      return undefined;
    }
    return user;
  }
}
