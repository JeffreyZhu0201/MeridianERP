/**
 * 经销商模块 (DistributorsModule)
 *
 * 聚合经销商相关的控制器和服务。
 * 注意：Phase 5 后该模块功能已迁移至平台侧。
 */
import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { DistributorsController } from './distributors.controller';
import { DistributorsService } from './distributors.service';

@Module({
  imports: [AuthModule],
  controllers: [DistributorsController],
  providers: [DistributorsService],
})
export class DistributorsModule {}
