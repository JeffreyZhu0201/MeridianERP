import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

/**
 * 商户所有者角色守卫
 *
 * @description
 * 此守卫验证用户是否具有 MERCHANT_OWNER 角色，用于保护需要商户主权限的操作。
 * 与其他认证守卫不同，此守卫不验证 JWT token，只验证已认证用户的角色。
 *
 * ## 使用场景
 * - 删除商户账户或重要数据
 * - 修改商户核心设置
 * - 批准或拒绝分店的申请
 * - 访问财务或结算相关功能
 *
 * ## 重要说明
 * - 此守卫 **不验证认证**，假设请求已经过认证守卫（如 MerchantAuthGuard）验证
 * - 必须与认证守卫一起使用：`@UseGuards(MerchantAuthGuard, MerchantOwnerGuard)`
 * - 使用顺序很重要：先认证，再授权
 *
 * @example
 * ```typescript
 * // 正确的使用方式：先认证后授权
 * @Delete('merchant')
 * @UseGuards(MerchantAuthGuard, MerchantOwnerGuard)
 * deleteMerchant(@CurrentUser() user: AuthenticatedUser) {
 *   // 只有 MERCHANT_OWNER 角色才能执行此操作
 *   return this.merchantService.delete(user.tenantId);
 * }
 *
 * // 错误示例：缺少认证守卫
 * @Delete('merchant')
 * @UseGuards(MerchantOwnerGuard)  // 危险！无法验证用户身份
 * deleteMerchant() { ... }
 * ```
 *
 * @see MerchantAuthGuard 商户认证守卫（必须先通过）
 */
@Injectable()
export class MerchantOwnerGuard implements CanActivate {
  /**
   * 守卫激活逻辑
   *
   * @description
   * 从请求对象中获取已认证用户，检查其 roles 数组是否包含 'MERCHANT_OWNER'。
   *
   * @param context - 执行上下文，包含已认证用户的请求
   * @returns true 用户具有 MERCHANT_OWNER 角色
   * @throws ForbiddenException 用户不具有 MERCHANT_OWNER 角色或未认证
   */
  canActivate(context: ExecutionContext): boolean {
    // 从请求中获取认证守卫设置的用户对象
    const user = context.switchToHttp().getRequest().user as AuthenticatedUser;

    // 验证用户具有 MERCHANT_OWNER 角色
    if (!user?.roles?.includes('MERCHANT_OWNER')) {
      throw new ForbiddenException('Merchant owner role required');
    }

    return true;
  }
}
