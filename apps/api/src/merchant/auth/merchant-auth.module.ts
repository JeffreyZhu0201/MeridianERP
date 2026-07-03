import { Module } from '@nestjs/common';
import { MerchantAuthController } from './merchant-auth.controller';
import { MerchantAuthService } from './merchant-auth.service';
import { AuthModule } from '../../auth/auth.module';
import { PlatformAccountsModule } from '../../platform/accounts/platform-accounts.module';

@Module({
  imports: [AuthModule, PlatformAccountsModule],
  controllers: [MerchantAuthController],
  providers: [MerchantAuthService],
})
export class MerchantAuthModule {}
