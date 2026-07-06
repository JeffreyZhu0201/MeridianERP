import { Module } from '@nestjs/common';
import { EnvModule } from '../config/env.module';
import { PayoutService } from './payout.service';

@Module({
  imports: [EnvModule],
  providers: [PayoutService],
  exports: [PayoutService],
})
export class PayoutModule {}
