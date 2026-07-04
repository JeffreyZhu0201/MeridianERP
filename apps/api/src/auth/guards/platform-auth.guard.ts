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

@Injectable()
export class PlatformAuthGuard extends AuthGuard('platform-jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // 方法级别的装饰器
      context.getClass(), // 类级别的装饰器
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
