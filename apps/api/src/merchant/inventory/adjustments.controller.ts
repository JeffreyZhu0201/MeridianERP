import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import {
  AdjustmentListQueryDto,
  CreateStockAdjustmentDto,
  UpdateReorderThresholdDto,
} from './dto/inventory.dto';
import { MerchantInventoryService } from './merchant-inventory.service';

@Controller('merchant/inventory')
@UseGuards(MerchantAuthGuard)
export class MerchantAdjustmentsController {
  constructor(private readonly inventoryService: MerchantInventoryService) {}

  @Post('adjustments')
  @HttpCode(201)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStockAdjustmentDto,
  ) {
    return this.inventoryService.createAdjustment(user, dto);
  }

  @Get('adjustments')
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: AdjustmentListQueryDto) {
    return this.inventoryService.listAdjustments(user.tenantId!, query);
  }

  @Get('alerts/low-stock')
  lowStock(@CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.lowStockAlerts(user.tenantId!);
  }

  @Patch('variants/:variantId/reorder-threshold')
  updateReorderThreshold(
    @CurrentUser() user: AuthenticatedUser,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateReorderThresholdDto,
  ) {
    return this.inventoryService.updateReorderThreshold(user, variantId, dto);
  }
}
