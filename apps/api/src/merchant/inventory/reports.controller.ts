import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { AdjustmentListQueryDto } from './dto/inventory.dto';
import { MerchantInventoryService } from './merchant-inventory.service';

/**
 * 库存报表控制器 (MerchantInventoryReportsController)
 *
 * 提供库存相关报表 API：
 * - GET /merchant/inventory/reports/stock - 库存报表
 * - GET /merchant/inventory/reports/adjustments - 调整记录报表
 * - GET /merchant/inventory/reports/export/stock - 导出库存 CSV
 * - GET /merchant/inventory/reports/export/adjustments - 导出调整记录 CSV
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
@Controller('merchant/inventory/reports')
@UseGuards(MerchantAuthGuard)
export class MerchantInventoryReportsController {
  constructor(private readonly inventoryService: MerchantInventoryService) {}

  @Get('stock')
  stock(@CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.stockReport(user.tenantId!);
  }

  @Get('adjustments')
  adjustments(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AdjustmentListQueryDto,
  ) {
    return this.inventoryService.adjustmentsReport(user.tenantId!, query);
  }

  @Get('export/stock')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="stock-report.csv"')
  exportStock(@CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.stockReportCsv(user.tenantId!);
  }

  @Get('export/adjustments')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="adjustments-report.csv"')
  exportAdjustments(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AdjustmentListQueryDto,
  ) {
    return this.inventoryService.adjustmentsReportCsv(user.tenantId!, query);
  }
}
