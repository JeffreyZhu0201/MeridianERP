import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CommissionService } from './commission.service';

@Module({
  imports: [PrismaModule, QueueModule],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
