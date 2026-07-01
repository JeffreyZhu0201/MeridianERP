import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 租户 ID 参数装饰器
 *
 * ## 作用
 *
 * 从当前请求对象中提取 tenantId。
 * tenantId 由 TenantInterceptor 在请求进入 Controller 之前设置。
 *
 * ## 工作流程
 *
 * ```
 * 请求 → TenantInterceptor
 *       → 设置 request.tenantId
 *       → Controller 方法参数 @TenantId()
 *       → 获取 request.tenantId 的值
 * ```
 *
 * ## 使用方式
 *
 * 在 Controller 方法参数中使用：
 * ```typescript
 * @Get('orders')
 * getOrders(@TenantId() tenantId: string) {
 *   // tenantId 自动从 request.tenantId 获取
 *   return this.orderService.findAll({ tenantId });
 * }
 * ```
 *
 * ## 类型安全
 *
 * - 返回类型为 string
 * - 假设 TenantInterceptor 已确保 tenantId 存在
 * - 如果 tenantId 不存在，说明认证/拦截器配置有问题
 *
 * @param _data - 未使用参数（保留 NestJS 装饰器接口兼容性）
 * @param ctx - NestJS 执行上下文（包含请求对象）
 * @returns tenantId 租户 ID 字符串
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ tenantId: string }>();
    return request.tenantId;
  },
);
