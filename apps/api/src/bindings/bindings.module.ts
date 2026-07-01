/**
 * 绑定模块 - BindingsModule
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 模块概述
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 本模块是经销商绑定功能的核心模块，整合了控制器和服务层。
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 核心功能
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 1. 管理商户/消费者与经销商之间的绑定关系
 *    └─→ Binding 表记录绑定关系
 *
 * 2. 提供绑定令牌（二维码）验证接口
 *    └─→ verify() 公开接口
 *
 * 3. 处理绑定认领流程
 *    └─→ claimMerchant() 商户绑定
 *    └─→ claimCustomer() 消费者绑定（通过 Store 模块）
 *
 * 4. 维护消费者购物车与经销商的关联
 *    └→ ensureCartDistributor() 内部方法
 *
 * 5. 触发绑定相关的邮件通知
 *    └→ notifyBindingCreatedIfEnabled() 条件执行
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 模块架构
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *   BindingsModule
 *   │
 *   ├── BindingsController        ← HTTP 请求入口
 *   │   ├── GET  /bindings/verify/:token   (Public)
 *   │   └── POST /bindings/claim          (MerchantAuthGuard)
 *   │
 *   └── BindingsService           ← 业务逻辑
 *       ├── verify()              ← 验证令牌
 *       ├── claimMerchant()       ← 商户认领
 *       ├── claimCustomer()       ← 消费者认领（但由 Store 模块调用）
 *       ├── validateBindToken()   ← 内部验证
 *       ├── ensureCartDistributor()← 购物车关联
 *       ├── notifyBindingCreatedIfEnabled() ← 邮件通知
 *       └── formatBinding()        ← 响应格式化
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 依赖模块
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *   AuthModule
 *   ├─ 提供 JwtService（验证绑定令牌签名）
 *   └─ 提供 @Public() @UseGuards() 等装饰器/守卫
 *
 *   QueueModule
 *   ├─ 提供 EmailQueueService
 *   └─ 用于发送绑定成功通知邮件
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 与其他模块的关系
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *   BindingsModule
 *   │
 *   ├── MerchantModule ──────────→ DistributorsService.generateQr()
 *   │                              用于生成绑定二维码
 *   │
 *   ├── StoreModule ─────────────→ StoreBindingsService / StoreBindingsController
 *   │                              消费者绑定接口（/store/:slug/bind/*）
 *   │
 *   └── PlatformModule ──────────→ PlatformMerchantsService
 *                                  平台指定招募经销商（不影响本模块）
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 注意事项
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * - 消费者绑定不通过本模块，而是通过 StoreModule 中的 StoreBindingsController
 * - 佣金计算不使用本模块的 Binding 表，而是用 MerchantProfile.recruitedByDistributorId
 * - 本模块导出的 BindingsService 仅供测试或特殊场景使用
 *
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { QueueModule } from '../queue/queue.module';
import { BindingsController } from './bindings.controller';
import { BindingsService } from './bindings.service';

/**
 * 绑定模块定义 - BindingsModule
 *
 * 使用 NestJS 标准模块结构：
 * - imports：引入依赖的其他模块（AuthModule 提供 JWT，QueueModule 提供邮件队列）
 * - controllers：声明本模块的控制器（处理 HTTP 请求）
 * - providers：声明本模块的服务提供者（处理业务逻辑）
 * - exports：导出本模块的服务，供其他模块使用
 *
 * @see BindingsController HTTP 路由处理
 * @see BindingsService 业务逻辑实现
 */
@Module({
  // 导入依赖模块
  imports: [AuthModule, QueueModule],

  // 注册控制器
  controllers: [BindingsController],

  // 注册服务提供者
  providers: [BindingsService],

  // 导出服务，允许其他模块注入 BindingsService
  exports: [BindingsService],
})
export class BindingsModule {}
