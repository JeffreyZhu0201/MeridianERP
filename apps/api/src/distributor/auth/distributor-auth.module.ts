import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { DistributorAuthController } from './distributor-auth.controller';
import { DistributorAuthService } from './distributor-auth.service';

/**
 * 渠道经销商认证模块
 *
 * 该模块提供经销商身份验证相关的功能：
 * - DistributorAuthService：经销商登录认证逻辑
 * - DistributorAuthController：登录 API 端点
 *
 * 模块依赖：
 * - AuthModule：导入 JWT Service 和其他通用认证组件
 *
 * 导出：
 * - DistributorAuthService：供其他模块（如 PlatformWithdrawalsModule）使用
 */
@Module({
  imports: [AuthModule],
  controllers: [DistributorAuthController],
  providers: [DistributorAuthService],
  exports: [DistributorAuthService],
})
export class DistributorAuthModule {}
