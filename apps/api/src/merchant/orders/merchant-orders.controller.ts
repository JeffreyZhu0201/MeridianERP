import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { VerifyPickupDto } from './dto/verify-pickup.dto';
import { MerchantOrdersService } from './merchant-orders.service';

@Controller('merchant/orders')
@UseGuards(MerchantAuthGuard)
export class MerchantOrdersController {
  constructor(private readonly ordersService: MerchantOrdersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findAll(user.tenantId!);
  }

  @Get('pickup-pending')
  listPickupPending(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.listPickupPending(user.tenantId!);
  }

  @Get('delivery-pending')
  listDeliveryPending(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.listDeliveryPending(user.tenantId!);
  }

  @Post(':id/verify-pickup')
  @HttpCode(200)
  verifyPickup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: VerifyPickupDto,
  ) {
    return this.ordersService.verifyPickup(
      user.tenantId!,
      id,
      dto.code,
      user.userId,
    );
  }

  @Post(':id/ship')
  @HttpCode(200)
  shipDelivery(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.ordersService.shipDelivery(user.tenantId!, id, user.userId);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.cancelPending(user.tenantId!, id);
  }

  @Post(':id/refund')
  @HttpCode(200)
  refund(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.refundPaid(user.tenantId!, id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.findOne(user.tenantId!, id);
  }
}
