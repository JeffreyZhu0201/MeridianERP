import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma 服务 - 数据库连接管理
 *
 * ## 单例模式说明
 *
 * 本服务使用 NestJS 依赖注入的单例模式：
 * - PrismaModule 使用 @Global() 装饰器，使其成为全局模块
 * - PrismaService 只会被实例化一次（在 PrismaModule 中）
 * - 整个应用共享同一个 PrismaClient 实例
 *
 * ## 连接池管理
 *
 * PrismaClient 内部维护数据库连接池：
 * - onModuleInit: 首次调用时建立连接池（懒连接或显式调用）
 * - onModuleDestroy: 应用关闭时优雅断开所有连接
 *
 * ## 多租户隔离
 *
 * 所有数据库查询都应通过 tenantId 进行数据隔离。
 * TenantInterceptor 会从 JWT 中提取 tenantId 并附加到请求对象，
 * 服务层通过 @TenantId() 装饰器获取当前请求的 tenantId。
 *
 * ## 使用示例
 *
 * ```typescript
 * // 1. 注入服务
 * constructor(private prisma: PrismaService) {}
 *
 * // 2. 执行查询（自动使用连接池）
 * const orders = await this.prisma.order.findMany({
 *   where: { tenantId, status: 'PAID' }
 * });
 *
 * // 3. 事务操作
 * await this.prisma.$transaction(async (tx) => {
 *   await tx.order.update({ ... });
 *   await tx.inventory.update({ ... });
 * });
 * ```
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * 模块初始化时调用
   * 建立数据库连接池
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * 模块销毁时调用
   * 关闭数据库连接池，释放资源
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
