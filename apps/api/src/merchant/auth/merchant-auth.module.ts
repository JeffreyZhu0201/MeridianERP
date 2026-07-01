/**
 * 商户认证模块 (MerchantAuthModule)
 *
 * 聚合商户认证相关的控制器和服务。
 * 导入 AuthModule 以使用 JWT 相关功能。
 */
import { Module } from '@nestjs/common';
import { MerchantAuthController } from './merchant-auth.controller';
import { MerchantAuthService } from './merchant-auth.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MerchantAuthController],
  providers: [MerchantAuthService],
})
export class MerchantAuthModule {}
