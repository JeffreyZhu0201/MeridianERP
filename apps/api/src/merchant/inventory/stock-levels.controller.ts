import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { StockLevelListQueryDto } from './dto/inventory.dto';
import { MerchantInventoryService } from './merchant-inventory.service';

/**
 * 库存水平控制器 (MerchantStockLevelsController)
 *
 * 提供库存水平查询 API：
 * - GET /merchant/inventory/stock-levels - 获取库存水平列表（分页、筛选）
 * - GET /merchant/inventory/stock-levels/summary - 获取库存汇总
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
@Controller('merchant/inventory/stock-levels')
@UseGuards(MerchantAuthGuard)
export class MerchantStockLevelsController {
  constructor(private readonly inventoryService: MerchantInventoryService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: StockLevelListQueryDto) {
    return this.inventoryService.listStockLevels(user.tenantId!, query);
  }

  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.stockLevelsSummary(user.tenantId!);
  }
}
