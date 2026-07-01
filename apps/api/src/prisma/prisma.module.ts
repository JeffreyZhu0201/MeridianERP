import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Prisma 全局模块 - 提供数据库连接单例
 *
 * ## @Global() 装饰器的作用
 *
 * - 使 PrismaModule 成为全局模块，无需在每个模块中单独导入
 * - PrismaService 会自动注入到所有需要它的模块中
 * - 整个应用共享同一个 PrismaService 实例（单例）
 *
 * ## 模块导出（exports）
 *
 * PrismaModule 导出 PrismaService，使其对所有功能模块可用：
 * - Platform 模块：平台管理（配额、资金、订单）
 * - Merchant 模块：商户管理（库存、订单、仓库）
 * - Store 模块：商店前端（商品、购物车、结账）
 * - Distributor 模块：经销商管理（佣金、提现）
 *
 * ## 生命周期管理
 *
 * PrismaService 实现了 OnModuleInit 和 OnModuleDestroy：
 * - 启动时：建立数据库连接池
 * - 关闭时：优雅断开所有连接，避免连接泄漏
 *
 * ## 使用方式
 *
 * 在任何服务中直接注入 PrismaService：
 * ```typescript
 * constructor(private readonly prisma: PrismaService) {}
 * ```
 *
 * 不需要单独导入 PrismaModule，因为它是全局的。
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
