/*
 * @Author: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @Date: 2026-06-30 22:06:39
 * @LastEditors: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @LastEditTime: 2026-07-01 15:30:32
 * @FilePath: /MeridianERP/apps/api/src/auth/decorators/current-user.decorator.ts
 * @Description: Current user decorator
 * 
 * Copyright (c) 2026 by JeffreyZhu, All Rights Reserved. 
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

/**
 * 当前已认证用户信息的参数装饰器
 *
 * @description
 * 此装饰器从 HTTP 请求对象中提取经过验证的用户信息。在请求生命周期中，
 * 认证守卫（如 PlatformAuthGuard）首先验证 JWT token，验证通过后将用户信息
 * 附加到请求对象的 `user` 属性上。此装饰器负责从请求中提取该用户数据。
 *
 * @example
 * ```typescript
 * // 基本用法 - 获取完整用户信息
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return {
 *     id: user.userId,
 *     role: user.roles,
 *     tenant: user.tenantId
 *   };
 * }
 *
 * // 结合可选认证使用（配合 OptionalStoreAuthGuard）
 * @Get('cart')
 * getCart(@CurrentUser() user?: AuthenticatedUser) {
 *   if (!user) {
 *     return this.getGuestCart();
 *   }
 *   return this.getUserCart(user.userId);
 * }
 * ```
 *
 * @param _data - 未使用参数（保留以兼容 NestJS 的 createParamDecorator 接口）
 * @param ctx - NestJS 执行上下文，提供对 HTTP 请求的访问
 * @returns AuthenticatedUser 包含 userId、aud、tenantId、roles 的用户信息对象
 *
 * @remarks
 * - userId: 对应 JWT payload 中的 sub（用户唯一标识）
 * - aud: 受众类型，决定用户属于哪个角色体系
 * - tenantId: 租户 ID，商户和商店用户必填，用于数据隔离
 * - roles: 用户角色数组，如 ['MERCHANT_OWNER', 'SALES']
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    // 从 HTTP 请求中获取 user（由守卫设置）
    const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
