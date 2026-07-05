/*
 * @Author: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @Date: 2026-07-05 15:27:09
 * @LastEditors: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @LastEditTime: 2026-07-05 15:30:26
 * @FilePath: /MeridianERP/apps/api/src/store/auth/store-auth.controller.ts
 * @Description: 店铺平台认证控制器
 * 
 * Copyright (c) 2026 by JeffreyZhu, All Rights Reserved. 
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { StoreAuthGuard } from '../../auth/guards/store-auth.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { StoreLoginDto, StoreRegisterDto } from './dto/store-auth.dto';
import { StoreAuthService } from './store-auth.service';

/**
 * @description: 店铺平台认证控制器
 * @return {StorePlatformAuthController}
 * @author {Jeffrey Zhu}
 * @date {2026-07-05 15:29:17}
 * @version {1.0.0}
 * @example
 * const controller = new StorePlatformAuthController(authService);
 * controller.register({});
 * controller.login({});
 * controller.getMe({});
 */
@Controller('store/auth')
export class StorePlatformAuthController {
  constructor(private readonly authService: StoreAuthService) {}

  /**
   * @description: 注册店铺平台
   * @return {StoreRegisterDto}
   * @author {Jeffrey Zhu}
   * @date {2026-07-05 15:29:17}
   * @version {1.0.0}
   * @example
   * const controller = new StorePlatformAuthController(authService);
   * controller.register({});
   * controller.login({});
   * controller.getMe({});
   */  
  @Public()
  @Post('register')
  @HttpCode(201)
  register(@Body() dto: StoreRegisterDto) {
    return this.authService.registerGlobal(dto);
  }

  /**
   * @description: 登录店铺平台
   * @return {StoreLoginDto}
   * @author {Jeffrey Zhu}
   * @date {2026-07-05 15:29:17}
   * @version {1.0.0}
   * @example
   * const controller = new StorePlatformAuthController(authService);
   * controller.register({});
   * controller.login({});
   * controller.getMe({});
   */  
  @Public()
  @Post('login')
  @HttpCode(201)
  login(@Body() dto: StoreLoginDto) {
    return this.authService.loginGlobal(dto);
  }

  /**
   * @description: 获取店铺平台个人信息
   * @return {AuthenticatedUser}
   * @author {Jeffrey Zhu}
   * @date {2026-07-05 15:29:17}
   * @version {1.0.0}
   * @example
   * const controller = new StorePlatformAuthController(authService);
   * controller.register({});
   * controller.login({});
   * controller.getMe({});
   */  
  @Get('me')
  @UseGuards(StoreAuthGuard)
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.userId);
  }
}

/**
 * @description: 店铺平台认证控制器
 * @return {StoreAuthController}
 * @author {Jeffrey Zhu}
 * @date {2026-07-05 15:29:17}
 * @version {1.0.0}
 * @example
 * const controller = new StoreAuthController(authService);
 * controller.register({});
 * controller.login({});
 * controller.getMe({});
 */  
@Controller('store/:slug/auth')
export class StoreAuthController {
  constructor(private readonly authService: StoreAuthService) {}

  /**
   * @description: 注册店铺
   * @return {StoreRegisterDto}
   * @author {Jeffrey Zhu}
   * @date {2026-07-05 15:29:17}
   * @version {1.0.0}
   * @example
   * const controller = new StoreAuthController(authService);
   * controller.register({});
   * controller.login({});
   * controller.getMe({});
   */  
  @Public()
  @Post('register')
  @HttpCode(201)
  register(@Param('slug') slug: string, @Body() dto: StoreRegisterDto) {
    return this.authService.register(slug, dto);
  }

  /**
   * @description: 登录店铺
   * @return {StoreLoginDto}
   * @author {Jeffrey Zhu}
   * @date {2026-07-05 15:29:17}
   * @version {1.0.0}
   * @example
   * const controller = new StoreAuthController(authService);
   * controller.register({});
   * controller.login({});
   * controller.getMe({});
   */  
  @Public()
  @Post('login')
  @HttpCode(201)
  login(@Param('slug') slug: string, @Body() dto: StoreLoginDto) {
    return this.authService.login(slug, dto);
  }

  /**
   * @description: 附加店铺平台会话
   * @return {AuthenticatedUser}
   * @author {Jeffrey Zhu}
   * @date {2026-07-05 15:29:17}
   * @version {1.0.0}
   * @example
   * const controller = new StoreAuthController(authService);
   * controller.register({});
   * controller.login({});
   * controller.getMe({});
   */  
  @Post('session')
  @HttpCode(201)
  @UseGuards(StoreAuthGuard)
  attachSession(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.authService.attachSession(slug, user.userId);
  }
}
