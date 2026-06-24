import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformInventoryService } from './platform-inventory.service';

@Controller('platform/inventory')
@UseGuards(PlatformAuthGuard)
export class PlatformInventoryController {
  constructor(private readonly inventoryService: PlatformInventoryService) {}

  @Get('tenants/:tenantId/summary')
  async summary(@Param('tenantId') tenantId: string) {
    const summary = await this.inventoryService.getTenantSummary(tenantId);
    if (!summary) throw new NotFoundException('Tenant not found');
    return summary;
  }

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
