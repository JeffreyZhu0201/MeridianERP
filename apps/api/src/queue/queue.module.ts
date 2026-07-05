import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EMAIL_QUEUE } from '@meridian/shared';
import { EnvService } from '../config/env.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailProcessor } from './email.processor';
import { EmailQueueService } from './email-queue.service';
import { InventoryQueueService } from './inventory-queue.service';

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
      BullModule.registerQueue({ name: EMAIL_QUEUE }),
    ];

const queueProviders = [
  EmailQueueService,
  InventoryQueueService,
  ...(isTest ? [] : [EmailProcessor]),
];

@Module({
  imports: [...bullImports, PrismaModule],
  providers: queueProviders,
  exports: [EmailQueueService, InventoryQueueService],
})
export class QueueModule {}
