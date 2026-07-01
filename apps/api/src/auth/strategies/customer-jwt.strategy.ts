import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvService } from '../../config/env.service';
import { JwtPayload, AuthenticatedUser } from '../interfaces/jwt-payload.interface';

/**
 * 商店消费者 JWT 策略
 *
 * @description
 * 此策略用于验证商店消费者（customer/store）的 JWT token。消费者是
 * 购物应用的用户，可以在商店中浏览商品、下单和追踪订单。
 *
 * ## JWT 配置
 * - 密钥：JWT_STORE_SECRET（独立密钥）
 * - Token 提取：从 Authorization header 的 Bearer token
 * - 过期验证：不忽略
 *
 * ## 验证流程
 * 1. 提取并解码 JWT token
 * 2. 使用 JWT_STORE_SECRET 验证签名
 * 3. 检查 token 是否在有效期内
 * 4. 调用 validate() 验证受众和租户
 *
 * ## 消费者与租户
 * 消费者绑定到特定商户租户：
 * - 消费者在特定商店注册（属于某个 tenantId）
 * - 所有订单和操作与该租户关联
 * - 消费者不能访问其他商店的数据
 *
 * @example
 * ```typescript
 * // 控制器中使用
 * @Controller('orders')
 * @UseGuards(StoreAuthGuard)
 * export class OrderController {
 *   @Post()
 *   createOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
 *     // user.tenantId 确定订单属于哪个商店
 *     return this.orderService.create({
 *       customerId: user.userId,
 *       tenantId: user.tenantId,
 *       ...dto
 *     });
 *   }
 * }
 * ```
 *
 * @see StoreAuthGuard 使用此策略的守卫
 * @see OptionalStoreAuthGuard 可选认证守卫（允许匿名访问）
 */
@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'store-jwt') {
  constructor(env: EnvService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 商店使用独立的 JWT 密钥
      secretOrKey: env.getOrThrow('JWT_STORE_SECRET'),
    });
  }

  /**
   * 验证并转换 JWT payload 为认证用户信息
   *
   * @description
   * 验证商店消费者的 JWT payload：
   * 1. 验证受众（aud）为 'store'
   * 2. 验证存在 tenantId（商店属于特定商户）
   * 3. 转换并返回 AuthenticatedUser
   *
   * @param payload - JWT 解码后的负载
   * @returns AuthenticatedUser 认证用户信息
   * @throws UnauthorizedException 受众错误或缺少 tenantId
   */
  validate(payload: JwtPayload): AuthenticatedUser {
    // 验证受众为 store
    if (payload.aud !== 'store') {
      throw new UnauthorizedException('Invalid token audience');
    }

    // 商店消费者必须包含 tenantId（商店属于特定租户）
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
