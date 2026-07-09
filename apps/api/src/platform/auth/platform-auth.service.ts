/*
 * @Author: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @Date: 2026-07-01 15:46:25
 * @LastEditors: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @LastEditTime: 2026-07-01 15:48:16
 * @FilePath: /MeridianERP/apps/api/src/platform/auth/platform-auth.service.ts
 * @Description: Platform auth service
 * Platform auth service
 * - 平台管理员登录
 * - 平台管理员注册
 * - 平台管理员登出
 * - 平台管理员刷新令牌
 * - 平台管理员验证令牌
 * - 平台管理员验证令牌
 *
 * Copyright (c) 2026 by JeffreyZhu, All Rights Reserved.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ADMIN_ROLE_HOME_PATH, ADMIN_ROLE_PERMISSIONS } from '@meridian/shared';
import { EnvService } from '../../config/env.service';
import { audienceJwtSignOptions } from '../../auth/jwt-sign-options';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformLoginDto } from './dto/platform-login.dto';

@Injectable()
export class PlatformAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService,
  ) {}

  async login(dto: PlatformLoginDto) {
    const user = await this.prisma.platformUser.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = {
      sub: user.id,
      aud: 'admin' as const,
      roles: [user.role],
    };
    const role = user.role;
    return {
      accessToken: this.jwt.sign(
        payload,
        audienceJwtSignOptions(this.env, 'JWT_SECRET'),
      ),
      user: {
        email: user.email,
        role,
        homePath: ADMIN_ROLE_HOME_PATH[role] ?? '/',
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.platformUser.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('Admin not found');
    }

    const role = user.role;
    return {
      id: user.id,
      email: user.email,
      role,
      permissions: ADMIN_ROLE_PERMISSIONS[role] ?? [],
      homePath: ADMIN_ROLE_HOME_PATH[role] ?? '/',
    };
  }
}
