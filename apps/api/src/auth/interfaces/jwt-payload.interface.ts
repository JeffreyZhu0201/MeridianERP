/**
 * JWT 负载接口 - 定义 JWT token 中存储的用户信息结构
 *
 * @description
 * 此接口定义了 JWT token 中存储的用户信息结构。JWT 是一种自包含的令牌，
 * 包含了用户身份和权限信息，无需每次请求都查询数据库。
 *
 * ## 字段说明
 * | 字段 | 类型 | 说明 |
 * |------|------|------|
 * | sub | string | 用户唯一标识（subject），对应数据库中的 userId |
 * | aud | string | 受众类型，标识用户属于哪个角色体系 |
 * | tenantId | string? | 租户 ID，商户和商店用户必填 |
 * | roles | string[] | 用户角色数组，如 ['MERCHANT_OWNER', 'SALES'] |
 *
 * ## 受众（aud）类型
 * - `admin`: 平台管理员，拥有系统级管理权限
 * - `merchant`: 商户用户，管理店铺运营
 * - `store`: 商店消费者，在商店购物的顾客
 * - `distributor`: 渠道经销商，招募商户获取佣金
 *
 * ## 使用场景
 * JWT payload 在用户登录时由服务器生成，包含用户身份信息。
 * 客户端携带 token 访问受保护资源，服务器解码 token 验证身份。
 *
 * @example
 * ```typescript
 * // 登录时生成 JWT payload
 * const payload: JwtPayload = {
 *   sub: user.id,           // 用户 ID
 *   aud: 'merchant',        // 商户用户
 *   tenantId: user.tenantId, // 租户 ID
 *   roles: user.roles        // 角色数组
 * };
 * ```
 */
export interface JwtPayload {
  /** 用户 ID (subject) - 用户唯一标识 */
  sub: string;

  /** 受众类型 - 标识用户角色体系 */
  aud: 'admin' | 'merchant' | 'store' | 'distributor';

  /** 租户 ID - 用于商户和商店用户的数据隔离 */
  tenantId?: string;

  /** 用户角色数组 - 如 ['MERCHANT_OWNER', 'SALES'] */
  roles: string[];
}

/**
 * 已认证用户接口 - 从 JWT 验证后提取的用户信息
 *
 * @description
 * 此接口是从 JWT 验证成功后，用于请求上下文（request context）的用户信息格式。
 * 与 JwtPayload 类似，但进行了字段映射（sub -> userId）。
 *
 * ## 字段映射
 * - JwtPayload.sub -> AuthenticatedUser.userId
 * - JwtPayload.aud -> AuthenticatedUser.aud
 * - JwtPayload.tenantId -> AuthenticatedUser.tenantId
 * - JwtPayload.roles -> AuthenticatedUser.roles
 *
 * ## 使用方式
 * 通过 @CurrentUser() 装饰器获取当前认证用户：
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return {
 *     id: user.userId,
 *     type: user.aud,
 *     tenant: user.tenantId,
 *     permissions: user.roles
 *   };
 * }
 * ```
 */
export interface AuthenticatedUser {
  /** 用户 ID - 对应 JWT payload 中的 sub */
  userId: string;

  /** 受众类型 - 用户角色体系 */
  aud: JwtPayload['aud'];

  /** 租户 ID - 商户和商店用户必填 */
  tenantId?: string;

  /** 用户角色数组 */
  roles: string[];
}
