import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvService } from '../../config/env.service';
import { JwtPayload, AuthenticatedUser } from '../interfaces/jwt-payload.interface';

/**
 * 商户用户 JWT 策略
 *
 * @description
 * 此策略用于验证商户用户（merchant）的 JWT token。商户用户是 Merchandise ERP
 * 的核心角色，包括店主和店员，负责店铺运营管理。
 *
 * ## JWT 配置
 * - 密钥：JWT_MERCHANT_SECRET（独立于其他角色的密钥）
 * - Token 提取：从 Authorization header 的 Bearer token
 * - 过期验证：不忽略
 *
 * ## 验证流程
 * 1. 提取并解码 JWT token
 * 2. 使用 JWT_MERCHANT_SECRET 验证签名
 * 3. 检查 token 是否在有效期内
 * 4. 调用 validate() 验证受众和租户
 *
 * ## 租户隔离
 * 商户用户必须属于一个租户（tenantId），这确保了：
 * - 商户无法访问其他商户的数据
 * - 所有数据查询自动带上 tenantId 过滤
 * - 系统级别的数据（如 MasterSKU）由平台管理员管理
 *
 * @example
 * ```typescript
 * // 在 AuthModule 中注册
 * @Module({
 *   providers: [MerchantJwtStrategy],
 * })
 * export class AuthModule { }
 *
 * // 控制器中使用
 * @Controller('inventory')
 * @UseGuards(MerchantAuthGuard)
 * export class InventoryController {
 *   @Get('stock')
 *   getStock(@CurrentUser() user: AuthenticatedUser) {
 *     // user.tenantId 用于过滤数据
 *     return this.inventoryService.findByTenant(user.tenantId);
 *   }
 * }
 * ```
 *
 * @see MerchantAuthGuard 使用此策略的守卫
 */
@Injectable()
export class MerchantJwtStrategy extends PassportStrategy(Strategy, 'merchant-jwt') {
  constructor(env: EnvService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 商户使用独立的 JWT 密钥，确保与其他角色隔离
      secretOrKey: env.getOrThrow('JWT_MERCHANT_SECRET'),
    });
  }

  /**
   * 验证并转换 JWT payload 为认证用户信息
   *
   * @description
   * 验证商户用户的 JWT payload：
   * 1. 验证受众（aud）为 'merchant'
   * 2. 验证存在 tenantId（租户隔离必填）
   * 3. 转换并返回 AuthenticatedUser
   *
   * @param payload - JWT 解码后的负载
   * @returns AuthenticatedUser 认证用户信息
   * @throws UnauthorizedException 受众错误或缺少 tenantId
   */
  validate(payload: JwtPayload): AuthenticatedUser {
    // 验证受众为 merchant
    if (payload.aud !== 'merchant') {
      throw new UnauthorizedException('Invalid token audience');
    }

    // 商户用户必须包含 tenantId（用于租户数据隔离）
    if (!payload.tenantId) {
      throw new UnauthorizedException('Missing tenant context');
    }

    return {
      userId: payload.sub,
      aud: payload.aud,
      tenantId: payload.tenantId,
      roles: payload.roles,
    };
  }
}
