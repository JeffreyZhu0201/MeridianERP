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
import { PlatformOrdersService } from './platform-orders.service';

@Controller('platform/orders')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
export class PlatformOrdersController {
  constructor(private readonly ordersService: PlatformOrdersService) {}

  @Get()
  @PlatformRoles('SUPER_ADMIN', 'FULFILLMENT')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('fulfillmentType') fulfillmentType?: string,
    @Query('guestEmail') guestEmail?: string,
    @Query('tenantId') tenantId?: string,
    @Query('deliveryQueue') deliveryQueue?: string,
  ) {
    return this.ordersService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
      fulfillmentType,
      guestEmail,
      tenantId,
      deliveryQueue === 'true',
    );
  }

  @Get(':id')
  @PlatformRoles('SUPER_ADMIN', 'FULFILLMENT')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post(':id/ship')
  @HttpCode(200)
  @PlatformRoles('SUPER_ADMIN', 'FULFILLMENT')
  ship(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.ship(id, user.userId);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @PlatformRoles('SUPER_ADMIN', 'FULFILLMENT')
  cancel(@Param('id') id: string) {
    return this.ordersService.cancel(id);
  }

  @Post(':id/refund')
  @HttpCode(200)
  @PlatformRoles('SUPER_ADMIN', 'FINANCE')
  refund(
    @Param('id') id: string,
    @Query('allowFulfilled') allowFulfilled?: string,
  ) {
    return this.ordersService.refund(id, allowFulfilled === 'true');
  }
}
