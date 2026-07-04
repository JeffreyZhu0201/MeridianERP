import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import {
  BranchPurchaseOrderListQueryDto,
  CreateBranchPurchaseOrderDto,
} from './dto/procurement.dto';
import { MerchantProcurementService } from './merchant-procurement.service';

@Controller('merchant/procurement')
@UseGuards(MerchantAuthGuard)
export class MerchantProcurementController {
  constructor(private readonly service: MerchantProcurementService) {}

  @Get('catalog')
  listCatalog() {
    return this.service.listCatalog();
  }

  @Get('orders')
  listOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: BranchPurchaseOrderListQueryDto,
  ) {
    return this.service.listOrders(user.tenantId!, query);
  }

  @Get('orders/:id')
  getOrder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.getOrder(user.tenantId!, id);
  }

  @Post('orders')
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBranchPurchaseOrderDto,
  ) {
    return this.service.createOrder(user, dto);
  }

  @Post('orders/:id/pay')
  @HttpCode(200)
  payOrder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.payOrder(user, id);
  }

  @Post('orders/:id/confirm-receipt')
  @HttpCode(200)
  confirmReceipt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.confirmReceipt(user, id);
  }
}
