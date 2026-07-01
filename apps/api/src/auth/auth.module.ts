import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EnvService } from '../config/env.service';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import { DistributorJwtStrategy } from './strategies/distributor-jwt.strategy';
import { PlatformJwtStrategy } from './strategies/platform-jwt.strategy';
import { MerchantJwtStrategy } from './strategies/merchant-jwt.strategy';
import { DistributorAuthGuard } from './guards/distributor-auth.guard';
import { OptionalStoreAuthGuard } from './guards/optional-store-auth.guard';
import { PlatformAuthGuard } from './guards/platform-auth.guard';
import { MerchantAuthGuard } from './guards/merchant-auth.guard';
import { StoreAuthGuard } from './guards/store-auth.guard';

/**
 * 认证模块 - 提供 JWT 认证和 Passport 策略支持
 *
 * @description
 * 此模块是整个应用认证系统的核心，提供基于 JWT 的身份验证功能。
 * 支持四种受众（audience）的独立认证，互不干扰。
 *
 * ## 模块结构
 * ```
 * AuthModule
 * ├── PassportModule (Passport 策略框架)
 * ├── JwtModule (JWT 处理)
 * ├── 策略 (4个)
 * │   ├── PlatformJwtStrategy (admin)
 * │   ├── MerchantJwtStrategy (merchant)
 * │   ├── CustomerJwtStrategy (store)
 * │   └── DistributorJwtStrategy (distributor)
 * └── 守卫 (5个)
 *     ├── PlatformAuthGuard
 *     ├── MerchantAuthGuard
 *     ├── StoreAuthGuard
 *     ├── DistributorAuthGuard
 *     └── OptionalStoreAuthGuard
 * ```
 *
 * ## JWT 密钥隔离
 * 四种受众使用独立的 JWT 密钥进行签名验证：
 * - `JWT_SECRET` → 平台管理员
 * - `JWT_MERCHANT_SECRET` → 商户用户
 * - `JWT_STORE_SECRET` → 商店消费者
 * - `JWT_DISTRIBUTOR_SECRET` → 渠道经销商
 *
 * 这种设计确保了不同角色的 token 无法相互混淆，提供了额外的安全性。
 *
 * ## Token 配置
 * - 签名算法：HS256
 * - 有效期：8 小时
 * - 提取方式：Authorization header Bearer token
 *
 * @example
 * ```typescript
 * // 在 AppModule 中导入
 * @Module({
 *   imports: [AuthModule],
 * })
 * export class AppModule { }
 *
 * // 在功能模块中使用认证守卫
 * @Controller('products')
 * @UseGuards(MerchantAuthGuard)
 * export class ProductController { ... }
 * ```
 */
@Module({
  imports: [
    // Passport 模块 - 提供基于策略的身份验证框架
    // 默认策略设为 platform-jwt，当未指定策略时使用
    PassportModule.register({ defaultStrategy: 'platform-jwt' }),

    // JWT 模块配置
    // 注意：此配置仅用于签名验证时的默认密钥
    // 各策略使用独立的 JWT 密钥（见上方说明）
    JwtModule.registerAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        // 默认 JWT 密钥（平台管理员使用）
        secret: env.getOrThrow('JWT_SECRET'),
        // Token 有效期 8 小时
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],

  // 提供者列表
  providers: [
    // ==================== JWT 策略 ====================
    // 用于验证不同受众的 token
    // 每个策略对应一种用户角色

    /** 平台管理员策略 - 验证 admin 受众的 JWT token */
    PlatformJwtStrategy,

    /** 商户用户策略 - 验证 merchant 受众的 JWT token */
    MerchantJwtStrategy,

    /** 商店消费者策略 - 验证 store 受众的 JWT token */
    CustomerJwtStrategy,

    /** 渠道经销商策略 - 验证 distributor 受众的 JWT token */
    DistributorJwtStrategy,

    // ==================== 认证守卫 ====================
    // 用于保护路由，验证请求是否具有有效身份

    /** 平台管理员守卫 - 保护平台管理员相关路由 */
    PlatformAuthGuard,

    /** 商户守卫 - 保护商户相关路由 */
    MerchantAuthGuard,

    /** 商店守卫 - 保护商店消费者相关路由 */
    StoreAuthGuard,

    /** 经销商守卫 - 保护渠道经销商相关路由 */
    DistributorAuthGuard,

    /** 可选商店守卫 - 允许认证和匿名访问（如购物车） */
    OptionalStoreAuthGuard,
  ],

  // 导出供其他模块使用
  exports: [
    JwtModule,                    // JWT 处理能力
    PlatformAuthGuard,            // 平台认证守卫
    MerchantAuthGuard,            // 商户认证守卫
    StoreAuthGuard,               // 商店认证守卫
    DistributorAuthGuard,         // 经销商认证守卫
    OptionalStoreAuthGuard,       // 可选商店守卫
  ],
})
export class AuthModule {}
