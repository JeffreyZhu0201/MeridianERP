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
  CreatePurchaseOrderDto,
  PurchaseOrderListQueryDto,
  ReceivePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from './dto/inventory.dto';
import { MerchantInventoryService } from './merchant-inventory.service';

/**
 * 采购订单控制器 (MerchantPurchaseOrdersController)
 *
 * 提供采购订单管理 API：
 * - GET /merchant/inventory/purchase-orders - 获取采购订单列表
 * - POST /merchant/inventory/purchase-orders - 创建采购订单
 * - GET /merchant/inventory/purchase-orders/:id - 获取采购订单详情
 * - PATCH /merchant/inventory/purchase-orders/:id - 更新采购订单（仅草稿状态）
 * - POST /merchant/inventory/purchase-orders/:id/submit - 提交采购订单
 * - POST /merchant/inventory/purchase-orders/:id/cancel - 取消采购订单
 * - POST /merchant/inventory/purchase-orders/:id/receive - 采购入库
 *
 * 订单状态流转：
 * DRAFT → ORDERED → PARTIALLY_RECEIVED → RECEIVED
 *                    ↘ CANCELLED ↙
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
@Controller('merchant/inventory/purchase-orders')
@UseGuards(MerchantAuthGuard)
export class MerchantPurchaseOrdersController {
  constructor(private readonly inventoryService: MerchantInventoryService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: PurchaseOrderListQueryDto) {
    return this.inventoryService.listPurchaseOrders(user.tenantId!, query);
  }

  @Post()
  @HttpCode(201)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePurchaseOrderDto) {
    return this.inventoryService.createPurchaseOrder(user, dto);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.inventoryService.getPurchaseOrder(user.tenantId!, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.inventoryService.updatePurchaseOrder(user, id, dto);
  }

  @Post(':id/submit')
  @HttpCode(200)
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.inventoryService.submitPurchaseOrder(user, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.inventoryService.cancelPurchaseOrder(user, id);
  }

  @Post(':id/receive')
  @HttpCode(200)
  receive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
  ) {
    return this.inventoryService.receivePurchaseOrder(user, id, dto);
  }
}
