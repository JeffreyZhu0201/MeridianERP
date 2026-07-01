import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvService } from '../../config/env.service';
import { JwtPayload, AuthenticatedUser } from '../interfaces/jwt-payload.interface';

/**
 * 平台管理员 JWT 策略
 *
 * @description
 * 此策略用于验证平台管理员（admin）的 JWT token。平台管理员是系统的
 * 超级用户，拥有管理所有租户和商户的权限。
 *
 * ## JWT 配置
 * - 密钥：JWT_SECRET（环境变量）
 * - Token 提取：从 Authorization header 的 Bearer token
 * - 过期验证：不忽略（必须验证 token 未过期）
 *
 * ## 验证流程
 * 1. Passport 调用 super() 时自动提取并解码 JWT
 * 2. 使用 JWT_SECRET 验证 token 签名
 * 3. 检查 token 是否在有效期内
 * 4. 调用 validate() 方法进一步验证和转换
 *
 * ## 返回用户信息
 * - userId: JWT 的 sub 字段（用户唯一标识）
 * - aud: 'admin'（受众类型）
 * - roles: 用户角色数组
 * - tenantId: 无（平台管理员是全局的，不属于任何租户）
 *
 * @example
 * ```typescript
 * // 在 auth.module.ts 中注册
 * @Module({
 *   providers: [PlatformJwtStrategy],
 * })
 * export class AuthModule { }
 *
 * // 在控制器中使用
 * @Controller('platform')
 * @UseGuards(PlatformAuthGuard)
 * export class PlatformController {
 *   @Get('tenants')
 *   getAllTenants() { ... }
 * }
 * ```
 *
 * @see PlatformAuthGuard 使用此策略的守卫
 */
@Injectable()
export class PlatformJwtStrategy extends PassportStrategy(Strategy, 'platform-jwt') {
  constructor(env: EnvService) {
    super({
      // 从 Authorization header 提取 Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 不忽略过期验证，确保 token 未过期
      ignoreExpiration: false,
      // 使用环境变量中的 JWT_SECRET 验证签名
      secretOrKey: env.getOrThrow('JWT_SECRET'),
    });
  }

  /**
   * 验证并转换 JWT payload 为认证用户信息
   *
   * @description
   * 此方法在 JWT 验证通过后被调用，负责：
   * 1. 验证受众（aud）为 'admin'
   * 2. 将 JWT payload 转换为 AuthenticatedUser 格式
   *
   * @param payload - JWT 解码后的负载，包含 sub、aud、roles 等
   * @returns AuthenticatedUser 认证用户信息
   * @throws UnauthorizedException 受众不是 'admin'
   */
  validate(payload: JwtPayload): AuthenticatedUser {
    // 验证受众为 admin（平台管理员专属受众）
    if (payload.aud !== 'admin') {
      throw new UnauthorizedException('Invalid token audience');
    }

    // 返回认证用户信息（平台管理员无 tenantId）
    return {
      userId: payload.sub,
      aud: payload.aud,
      roles: payload.roles,
    };
  }
}
