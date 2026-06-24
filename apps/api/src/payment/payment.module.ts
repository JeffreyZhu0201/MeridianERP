import { Module } from '@nestjs/common';
import { EnvModule } from '../config/env.module';
import { PaymentService } from './payment.service';

@Module({
  imports: [EnvModule],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
