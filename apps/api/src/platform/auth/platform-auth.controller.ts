/*
 * @Author: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @Date: 2026-07-01 15:46:25
 * @LastEditors: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @LastEditTime: 2026-07-01 15:47:09
 * @FilePath: /MeridianERP/apps/api/src/platform/auth/platform-auth.controller.ts
 * @Description: Platform auth controller
 * Platform auth controller
 * - 平台管理员登录
 * 
 * - 平台管理员注册
 * - 平台管理员登出
 * - 平台管理员刷新令牌
 * - 平台管理员验证令牌
 * - 平台管理员验证令牌
 * Copyright (c) 2026 by JeffreyZhu, All Rights Reserved. 
 */

import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { PlatformLoginDto } from './dto/platform-login.dto';
import { PlatformAuthService } from './platform-auth.service';

@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private readonly authService: PlatformAuthService) {}

  
  @Public()
  @Post('login')
  @HttpCode(201)
  login(@Body() dto: PlatformLoginDto) {
    return this.authService.login(dto);
  }
}
