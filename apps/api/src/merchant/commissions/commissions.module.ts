/**
 * 佣金模块 (CommissionsModule)
 *
 * 聚合商户佣金账本相关的控制器和服务。
 */
import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';

@Module({
  imports: [AuthModule],
  controllers: [CommissionsController],
  providers: [CommissionsService],
})
export class CommissionsModule {}
