import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { EnvModule } from '../../config/env.module';
import { PlatformDistributorsController } from './platform-distributors.controller';
import { PlatformDistributorsService } from './platform-distributors.service';

/**
 * 平台经销商模块
 *
 * 提供平台级经销商（渠道合作伙伴）管理功能。
 */
@Module({
  imports: [AuthModule, EnvModule],
  controllers: [PlatformDistributorsController],
  providers: [PlatformDistributorsService],
  exports: [PlatformDistributorsService],
})
export class PlatformDistributorsModule {}
