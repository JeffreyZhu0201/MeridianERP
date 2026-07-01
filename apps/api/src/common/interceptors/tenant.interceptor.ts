import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

/**
 * 租户上下文拦截器 - 多租户隔离的核心组件
 *
 * ## 工作原理
 *
 * 请求处理流程：
 * ```
 * 请求 → AuthGuard（验证 JWT，设置 request.user）
 *      → TenantInterceptor（提取 tenantId，设置 request.tenantId）
 *      → Controller（通过 @TenantId() 获取 tenantId）
 *      → Service（使用 tenantId 进行数据过滤）
 * ```
 *
 * ## JWT 中的 tenantId
 *
 * 不同角色的 JWT payload 包含不同的 tenantId：
 * - Merchant（商户）: tenantId = 商户自己的 ID
 * - Store（商店）: tenantId = 商店所属商户的 ID
 * - Distributor（经销商）: 无 tenantId（不需多租户隔离）
 * - Admin（平台）: 无 tenantId（可访问所有数据）
 *
 * ## 多租户隔离策略
 *
 * TenantInterceptor 确保：
 * 1. 所有商户/商店请求都带有 tenantId
 * 2. Service 层通过 @TenantId() 获取 tenantId
 * 3. 所有 Prisma 查询都包含 tenantId 过滤条件
 *
 * ## 使用示例
 *
 * ```typescript
 * // Controller
 * @UseGuards(MerchantAuthGuard)
 * @Get('orders')
 * getOrders(@TenantId() tenantId: string) {
 *   // tenantId 自动从 request.tenantId 获取
 *   return this.orderService.findAll({ tenantId });
 * }
 *
 * // Service
 * async findAll({ tenantId }: { tenantId: string }) {
 *   return this.prisma.order.findMany({
 *     where: { tenantId }  // 强制过滤
 *   });
 * }
 * ```
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      tenantId?: string;
    }>();
    // 从 JWT payload 中提取 tenantId 并附加到请求
    if (request.user?.tenantId) {
      request.tenantId = request.user.tenantId;
    }
    return next.handle();
  }
}
