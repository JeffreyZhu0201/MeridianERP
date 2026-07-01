import { Module } from '@nestjs/common';
import { DistributorAuthModule } from './auth/distributor-auth.module';
import { PlatformWithdrawalsModule } from '../platform/withdrawals/platform-withdrawals.module';
import { DistributorMeController } from './distributor-me.controller';
import { DistributorMeService } from './distributor-me.service';

/**
 * 渠道经销商模块
 *
 * 该模块整合了经销商相关的所有服务和控制器，提供：
 * - 经销商认证功能（登录、Token 签发）
 * - 经销商个人中心功能（仪表盘、分店、提现、佣金）
 *
 * 模块依赖：
 * - DistributorAuthModule：提供经销商身份验证服务
 * - PlatformWithdrawalsModule：提供平台级提现服务
 *
 * 导出的服务：
 * - DistributorMeService：个人中心业务逻辑
 */
@Module({
  imports: [DistributorAuthModule, PlatformWithdrawalsModule],
  controllers: [DistributorMeController],
  providers: [DistributorMeService],
})
export class DistributorModule {}
