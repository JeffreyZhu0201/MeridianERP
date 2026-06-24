import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { StockLevelListQueryDto } from './dto/inventory.dto';
import { MerchantInventoryService } from './merchant-inventory.service';

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
