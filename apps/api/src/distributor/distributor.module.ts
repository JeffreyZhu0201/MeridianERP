import { Module } from '@nestjs/common';
import { DistributorAuthModule } from './auth/distributor-auth.module';
import { PlatformWithdrawalsModule } from '../platform/withdrawals/platform-withdrawals.module';
import { DistributorMeController } from './distributor-me.controller';
import { DistributorMeService } from './distributor-me.service';

@Module({
  imports: [DistributorAuthModule, PlatformWithdrawalsModule],
  controllers: [DistributorMeController],
  providers: [DistributorMeService],
})
export class DistributorModule {}
