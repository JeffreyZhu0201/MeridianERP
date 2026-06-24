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
