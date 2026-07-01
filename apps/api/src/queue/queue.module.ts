import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { COMMISSION_QUEUE, EMAIL_QUEUE } from '@meridian/shared';
import { EnvService } from '../config/env.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommissionQueueService } from './commission-queue.service';
import { EmailProcessor } from './email.processor';
import { EmailQueueService } from './email-queue.service';
import { InventoryQueueService } from './inventory-queue.service';

/**
 * 测试环境标志
 * 测试环境中不启动 BullMQ（避免 Redis 依赖）
 */
const isTest = process.env.NODE_ENV === 'test';

/**
 * BullMQ 导入配置
 * - 测试环境：空数组（不使用 Redis）
 * - 其他环境：配置 Redis 连接和队列注册
 */
const bullImports = isTest
  ? []
  : [
      // 异步配置 BullMQ 连接
      BullModule.forRootAsync({
        inject: [EnvService],
        useFactory: (env: EnvService) => ({
          connection: {
            url: env.get('REDIS_URL', 'redis://localhost:6379'),
          },
        }),
      }),
      // 注册邮件队列和佣金队列
      BullModule.registerQueue(
        { name: EMAIL_QUEUE },
        { name: COMMISSION_QUEUE },
      ),
    ];

/**
 * 队列服务提供者
 * - 测试环境：不包含 EmailProcessor（不需要后台消费）
 * - 其他环境：包含所有服务
 */
const queueProviders = [
  EmailQueueService,
  CommissionQueueService,
  InventoryQueueService,
  ...(isTest ? [] : [EmailProcessor]),
];

/**
 * 队列模块 - 配置 BullMQ 和队列服务
 *
 * 功能：
 * - 连接 Redis（生产/开发环境）
 * - 注册邮件队列（EMAIL_QUEUE）
 * - 注册佣金队列（COMMISSION_QUEUE）
 * - 提供队列服务供其他模块注入
 *
 * 测试环境：完全禁用 BullMQ，所有队列操作降级为 stub
 */
@Module({
  imports: [...bullImports, PrismaModule],
  providers: queueProviders,
  exports: [EmailQueueService, CommissionQueueService, InventoryQueueService],
})
export class QueueModule {}
