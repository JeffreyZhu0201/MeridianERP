import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PlatformFundsController } from './platform-funds.controller';
import { MerchantFundsService, PlatformFundsService } from './platform-funds.service';

@Module({
  imports: [AuthModule],
  controllers: [PlatformFundsController],
  providers: [PlatformFundsService, MerchantFundsService],
  exports: [PlatformFundsService, MerchantFundsService],
})
export class PlatformFundsModule {}
