import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { StoreAuthGuard } from '../../auth/guards/store-auth.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { StoreOrdersService } from './store-orders.service';

@Controller('store/:slug/orders')
@UseGuards(StoreAuthGuard)  // 需要已登录的消费者
export class StoreOrdersController {
  
  constructor(private readonly ordersService: StoreOrdersService) {}

  
  @Get()
  list(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.listForCustomer(slug, user.userId);
  }

  
  @Get(':id/pickup-token')
  getPickupToken(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.getPickupToken(slug, user.userId, id);
  }

  
  @Get(':id')
  getOne(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.getForCustomer(slug, user.userId, id);
  }
}
