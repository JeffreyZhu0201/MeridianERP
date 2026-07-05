import { BullModule } from '@nestjs/bullmq';
import { Module, forwardRef } from '@nestjs/common';
import { EMAIL_QUEUE, ORDER_QUEUE } from '@meridian/shared';
import { EnvService } from '../config/env.service';
import { OrderLifecycleModule } from '../orders/order-lifecycle.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailProcessor } from './email.processor';
import { EmailQueueService } from './email-queue.service';
import { InventoryQueueService } from './inventory-queue.service';
import { OrderProcessor } from './order.processor';
import { OrderQueueService } from './order-queue.service';

const isTest = process.env.NODE_ENV === 'test';

const bullImports = isTest
  ? []
  : [
      BullModule.forRootAsync({
        inject: [EnvService],
        useFactory: (env: EnvService) => ({
          connection: {
            url: env.get('REDIS_URL', 'redis://localhost:6379'),
          },
        }),
      }),
      BullModule.registerQueue({ name: EMAIL_QUEUE }, { name: ORDER_QUEUE }),
    ];

const queueProviders = [
  EmailQueueService,
  InventoryQueueService,
  OrderQueueService,
  ...(isTest ? [] : [EmailProcessor, OrderProcessor]),
];

@Module({
  imports: [
    ...bullImports,
    PrismaModule,
    forwardRef(() => OrderLifecycleModule),
  ],
  providers: queueProviders,
  exports: [EmailQueueService, InventoryQueueService, OrderQueueService],
})
export class QueueModule {}
