import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformInventoryService } from './platform-inventory.service';

/**
 * 平台库存控制器 - 提供跨租户库存查看的 API 端点
 *
 * 端点：
 * GET /platform/inventory/tenants/:tenantId/summary - 获取商户库存汇总
 * GET /platform/inventory/tenants/:tenantId/adjustments - 查询库存调整记录
 * GET /platform/inventory/tenants/:tenantId/purchase-orders - 查询采购订单
 *
 * 认证：需要 PlatformAuthGuard（平台管理员 JWT）
 */
@Controller('platform/inventory')
@UseGuards(PlatformAuthGuard)
export class PlatformInventoryController {
  constructor(private readonly inventoryService: PlatformInventoryService) {}

  /**
   * 获取商户库存汇总
   *
   * @param tenantId - 商户租户 ID
   * @returns 库存汇总信息
   * @throws NotFoundException - 租户不存在
   */
  @Get('tenants/:tenantId/summary')
  async summary(@Param('tenantId') tenantId: string) {
    const summary = await this.inventoryService.getTenantSummary(tenantId);
    if (!summary) throw new NotFoundException('Tenant not found');
    return summary;
  }

  /**
   * 查询库存调整记录
   *
   * @param tenantId - 商户租户 ID
   * @param limit - 返回数量（默认50）
   * @param from - 起始日期（可选）
   * @param to - 结束日期（可选）
   * @returns 库存调整分页列表
   */
  @Get('tenants/:tenantId/adjustments')
  adjustments(
    @Param('tenantId') tenantId: string,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.inventoryService.listAdjustments(
      tenantId,
      limit ? parseInt(limit, 10) : 50,
      from,
      to,
    );
  }

  /**
   * 查询采购订单列表
   *
   * @param tenantId - 商户租户 ID
   * @param status - 可选，按状态筛选
   * @param limit - 返回数量（默认50）
   * @returns 采购订单分页列表
   */
  @Get('tenants/:tenantId/purchase-orders')
  purchaseOrders(
    @Param('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.listPurchaseOrders(
      tenantId,
      status,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
