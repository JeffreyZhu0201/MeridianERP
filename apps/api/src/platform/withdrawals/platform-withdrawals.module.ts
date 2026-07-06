import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PayoutModule } from '../../payout/payout.module';
import { PlatformWithdrawalsController } from './platform-withdrawals.controller';
import { PlatformWithdrawalsService } from './platform-withdrawals.service';

@Module({
  imports: [AuthModule, PayoutModule],
  controllers: [PlatformWithdrawalsController],
  providers: [PlatformWithdrawalsService],
  exports: [PlatformWithdrawalsService],
})
export class PlatformWithdrawalsModule {}
