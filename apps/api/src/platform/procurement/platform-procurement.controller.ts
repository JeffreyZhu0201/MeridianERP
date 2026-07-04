import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformRolesGuard } from '../../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../../auth/decorators/platform-roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PlatformBranchPurchaseOrderListQueryDto } from '../../merchant/procurement/dto/procurement.dto';
import { PlatformProcurementService } from './platform-procurement.service';

@Controller('platform/procurement')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
@PlatformRoles('SUPER_ADMIN', 'FULFILLMENT')
export class PlatformProcurementController {
  constructor(private readonly service: PlatformProcurementService) {}

  @Get('orders')
  listOrders(@Query() query: PlatformBranchPurchaseOrderListQueryDto) {
    return this.service.listOrders(query);
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.service.getOrder(id);
  }

  @Post('orders/:id/ship')
  @HttpCode(200)
  shipOrder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.shipOrder(user.userId, id);
  }
}
