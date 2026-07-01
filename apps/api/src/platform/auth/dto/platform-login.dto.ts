/*
 * @Author: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @Date: 2026-06-30 20:32:10
 * @LastEditors: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @LastEditTime: 2026-07-01 15:17:21
 * @FilePath: /MeridianERP/apps/api/src/platform/auth/dto/platform-login.dto.ts
 * @Description: Platform login DTO
 * 
 * Copyright (c) 2026 by JeffreyZhu, All Rights Reserved. 
 */
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * 平台管理员登录 DTO
 */
export class PlatformLoginDto {
  /** 管理员邮箱 */
  @IsEmail()
  email!: string;

  /** 密码（最小6个字符） */
  @IsString()
  @MinLength(6)
  password!: string;
}
