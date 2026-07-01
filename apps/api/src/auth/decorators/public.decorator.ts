import { SetMetadata } from '@nestjs/common';

/**
 * 公开端点标记的 metadata key
 *
 * @description
 * 此常量作为 metadata 的键名，用于在端点上标记该端点是否公开访问。
 * 守卫通过 Reflector 读取此 metadata 来判断是否跳过 JWT 验证。
 *
 * @see Public 装饰器设置此 metadata 为 true
 * @see PlatformAuthGuard 等守卫读取此 metadata
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 标记端点为公开访问（无需认证）
 *
 * @description
 * 此装饰器用于将端点标记为公开访问，从而跳过所有认证守卫的 JWT 验证。
 * 适用于以下场景：
 * - 健康检查端点（如 /health）
 * - 公开文档或静态资源
 * - 登录/注册等公开 API
 * - 任何无需认证即可访问的端点
 *
 * @example
 * ```typescript
 * // 单独使用
 * @Public()
 * @Get('health')
 * health() { return 'ok' }
 *
 * // 与其他装饰器组合使用
 * @Public()
 * @Post('login')
 * login(@Body() credentials: LoginDto) { ... }
 *
 * // 控制器级别：整个控制器的端点都是公开的
 * @Controller('public')
 * @Public()
 * export class PublicController { ... }
 * ```
 *
 * @remarks
 * - 方法级别的 @Public() 会覆盖类级别的设置
 * - 此装饰器仅跳过认证，不跳过授权（如角色检查）
 * - 使用时确保该端点不包含敏感操作
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
