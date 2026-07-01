import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvService } from '../../config/env.service';
import { JwtPayload, AuthenticatedUser } from '../interfaces/jwt-payload.interface';

/**
 * 渠道经销商 JWT 策略
 *
 * @description
 * 此策略用于验证渠道经销商（distributor）的 JWT token。渠道经销商是
 * MeridianERP 的 B2B 角色，负责招募商户加入平台并获取佣金收益。
 *
 * ## JWT 配置
 * - 密钥：JWT_DISTRIBUTOR_SECRET（独立密钥）
 * - Token 提取：从 Authorization header 的 Bearer token
 * - 过期验证：不忽略
 *
 * ## 验证流程
 * 1. 提取并解码 JWT token
 * 2. 使用 JWT_DISTRIBUTOR_SECRET 验证签名
 * 3. 检查 token 是否在有效期内
 * 4. 调用 validate() 验证受众、租户和角色
 *
 * ## 额外验证
 * 与其他策略不同，此策略额外验证：
 * - roles 数组必须包含 'DISTRIBUTOR'
 * - 这是因为经销商角色具有招募商户的特殊权限
 *
 * ## 经销商权限
 * - 招募新商户加入平台
 * - 查看直接招募商户的业绩报表
 * - 获取佣金收益（CommissionLedger）
 * - 提现佣金余额
 *
 * @example
 * ```typescript
 * // 控制器中使用
 * @Controller('distributor')
 * @UseGuards(DistributorAuthGuard)
 * export class DistributorController {
 *   @Get('commissions')
 *   getCommissions(@CurrentUser() user: AuthenticatedUser) {
 *     // user.userId 用于查询该经销商的佣金记录
 *     return this.commissionService.getLedger(user.userId, user.tenantId);
 *   }
 * }
 * ```
 *
 * @see DistributorAuthGuard 使用此策略的守卫
 */
@Injectable()
export class DistributorJwtStrategy extends PassportStrategy(Strategy, 'distributor-jwt') {
  constructor(env: EnvService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 经销商使用独立的 JWT 密钥
      secretOrKey: env.getOrThrow('JWT_DISTRIBUTOR_SECRET'),
    });
  }

  /**
   * 验证并转换 JWT payload 为认证用户信息
   *
   * @description
   * 验证渠道经销商的 JWT payload：
   * 1. 验证受众（aud）为 'distributor'
   * 2. 验证存在 tenantId
   * 3. 验证 roles 包含 'DISTRIBUTOR'
   * 4. 转换并返回 AuthenticatedUser
   *
   * @param payload - JWT 解码后的负载
   * @returns AuthenticatedUser 认证用户信息
   * @throws UnauthorizedException 验证失败（受众错误、缺少 tenantId 或角色）
   */
  validate(payload: JwtPayload): AuthenticatedUser {
    // 验证受众为 distributor
    if (payload.aud !== 'distributor') {
      throw new UnauthorizedException('Invalid token audience');
    }

    // 经销商必须包含 tenantId
    if (!payload.tenantId) {
      throw new UnauthorizedException('Missing tenant context');
    }

    // 经销商必须具有 DISTRIBUTOR 角色（特殊权限验证）
    if (!payload.roles.includes('DISTRIBUTOR')) {
      throw new UnauthorizedException('Invalid distributor role');
    }

    return {
      userId: payload.sub,
      aud: payload.aud,
      tenantId: payload.tenantId,
      roles: payload.roles,
    };
  }
}
