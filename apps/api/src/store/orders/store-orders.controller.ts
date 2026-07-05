import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { StoreAuthGuard } from '../../auth/guards/store-auth.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { StoreAuthService } from '../auth/store-auth.service';
import { StoreTenantService } from '../common/store-tenant.service';
import { StoreOrdersService } from './store-orders.service';

@Controller('store/account/orders')
@UseGuards(StoreAuthGuard)
export class StoreAccountOrdersController {
  constructor(private readonly ordersService: StoreOrdersService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.listForAccount(user.userId);
  }
}

@Controller('store/:slug/orders')
@UseGuards(StoreAuthGuard)
export class StoreOrdersController {
  constructor(
    private readonly ordersService: StoreOrdersService,
    private readonly storeAuth: StoreAuthService,
    private readonly storeTenant: StoreTenantService,
  ) {}

  private async resolveCustomerId(slug: string, userId: string) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    return this.storeAuth.resolveCustomerId(userId, tenant.id);
  }

  @Get()
  async list(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const customerId = await this.resolveCustomerId(slug, user.userId);
    return this.ordersService.listForCustomer(slug, customerId);
  }

  @Get(':id/pickup-token')
  async getPickupToken(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const customerId = await this.resolveCustomerId(slug, user.userId);
    return this.ordersService.getPickupToken(slug, customerId, id);
  }

  @Get(':id')
  async getOne(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const customerId = await this.resolveCustomerId(slug, user.userId);
    return this.ordersService.getForCustomer(slug, customerId, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  async cancel(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const customerId = await this.resolveCustomerId(slug, user.userId);
    return this.ordersService.cancelForCustomer(slug, customerId, id);
  }

  @Post(':id/confirm-delivery')
  @HttpCode(200)
  async confirmDelivery(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const customerId = await this.resolveCustomerId(slug, user.userId);
    return this.ordersService.confirmDelivery(slug, customerId, id);
  }
}
