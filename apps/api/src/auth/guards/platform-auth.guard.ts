/*
 * @Author: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @Date: 2026-06-30 22:07:13
 * @LastEditors: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @LastEditTime: 2026-07-01 17:23:08
 * @FilePath: /MeridianERP/apps/api/src/auth/guards/platform-auth.guard.ts
 * @Description: Platform auth guard
 * PlatformJwtStrategy -> PlatformAuthGuard -> PlatformController -> PlatformService
 * Copyright (c) 2026 by JeffreyZhu, All Rights Reserved. 
 */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * 平台管理员认证守卫
 *
 * @description
 * 此守卫用于保护平台管理员（admin）相关的 API 端点。它继承自 Passport 的
 * AuthGuard，结合 'platform-jwt' 策略完成 JWT token 的验证工作。
 *
 * ## JWT 验证流程
 * 1. 从请求的 Authorization header 中提取 Bearer token
 * 2. 使用 JWT_SECRET 密钥验证 token 签名
 * 3. 验证 token 未过期（ignoreExpiration: false）
 * 4. 验证 token 的 aud（audience）字段为 'admin'
 * 5. 验证通过后，将用户信息附加到请求对象上
 *
 * ## 与 @Public() 的配合
 * - 如果端点或控制器标记了 @Public()，则跳过所有验证直接放行
 * - 使用 Reflector 获取方法级别和类级别的 metadata
 * - 方法级别优先级高于类级别
 *
 * @example
 * ```typescript
 * // 保护整个控制器
 * @Controller('platform')
 * @UseGuards(PlatformAuthGuard)
 * export class PlatformController { ... }
 *
 * // 保护单个端点
 * @Get('stats')
 * @UseGuards(PlatformAuthGuard)
 * getStats() { ... }
 *
 * // 公开特定端点
 * @Get('public-info')
 * @Public()  // 跳过认证
 * getPublicInfo() { ... }
 * ```
 * @see PlatformJwtStrategy 实际的 JWT 验证策略
 * @see Public 公开端点装饰器
 */

@Injectable()
export class PlatformAuthGuard extends AuthGuard('platform-jwt') { 
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * 守卫激活逻辑
   *
   * @description
   * 此方法在每个请求到达时被调用，决定是否允许请求继续。
   * 首先检查端点是否公开，然后执行 JWT 认证。
   *
   * @param context - 执行上下文，包含请求信息
   * @returns true 放行（公开端点或认证成功），或调用父类执行 JWT 验证
   *
   * @remarks
   * - 使用 getAllAndOverride 确保方法级别设置优先于类级别
   * - super.canActivate() 会触发 Passport 的验证流程
   */
  canActivate(context: ExecutionContext) {
    // 从方法和类上获取 @Public 标记，方法级别优先
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // 方法级别的装饰器
      context.getClass(),   // 类级别的装饰器
    ]);

    // 公开端点：跳过认证，直接放行
    if (isPublic) {
      return true;
    }

    // 非公开端点：执行标准 JWT 认证流程
    return super.canActivate(context);
  }
}
