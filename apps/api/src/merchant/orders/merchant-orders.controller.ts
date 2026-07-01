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
import { MerchantOrdersService } from './merchant-orders.service';

/**
 * 商户订单控制器 (MerchantOrdersController)
 *
 * 提供订单管理 API：
 * - GET /merchant/orders - 获取订单列表
 * - GET /merchant/orders/:id - 获取订单详情
 * - GET /merchant/orders/pickup-pending - 获取待自提订单列表
 * - POST /merchant/orders/:id/verify-pickup - 核销自提订单
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
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

  @Post(':id/verify-pickup')
  @HttpCode(200)
  verifyPickup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: { code: string },
  ) {
    return this.ordersService.verifyPickup(
      user.tenantId!,
      id,
      dto.code,
      user.userId,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.findOne(user.tenantId!, id);
  }
}
