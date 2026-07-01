import { Module } from '@nestjs/common';
import { PlatformAuthController } from './platform-auth.controller';
import { PlatformAuthService } from './platform-auth.service';
import { AuthModule } from '../../auth/auth.module';

/**
 * 平台认证模块
 *
 * 提供平台管理员认证功能（登录）。
 */
@Module({
  imports: [AuthModule],
  controllers: [PlatformAuthController],
  providers: [PlatformAuthService],
})
export class PlatformAuthModule {}
