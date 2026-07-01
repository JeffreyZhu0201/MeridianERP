/**
 * 佣金模块 (CommissionModule)
 *
 * ========================================
 * 模块职责
 * ========================================
 * 本模块是佣金体系的核心模块，负责：
 * 1. 佣金的计算和记录（CommissionService）
 * 2. 佣金的异步处理（依赖 CommissionQueueService）
 * 3. 佣金通知邮件发送（依赖 EmailQueueService）
 *
 * ========================================
 * 依赖关系
 * ========================================
 *
 * PrismaModule
 * └── 提供 PrismaService（数据库访问）
 *
 * QueueModule
 * ├── CommissionQueueService（佣金计算后台任务队列）
 * └── EmailQueueService（邮件发送队列）
 *
 * ========================================
 * 导出内容
 * ========================================
 * - CommissionService：被 OrderModule、MerchantModule 等模块消费
 *
 * ========================================
 * 使用示例
 * ========================================
 * // 在 AppModule 或 OrderModule 中导入
 * import { CommissionModule } from './commission/commission.module';
 *
 * @example
 * @Module({
 *   imports: [CommissionModule],
 * })
 * export class OrderModule {}
 */
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
