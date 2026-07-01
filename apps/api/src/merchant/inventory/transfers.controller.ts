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
  CreateStockTransferDto,
  StockTransferListQueryDto,
} from './dto/inventory.dto';
import { MerchantTransfersService } from './transfers.service';

/**
 * 库存调拨控制器 (MerchantTransfersController)
 *
 * 提供库存调拨 API：
 * - POST /merchant/inventory/transfers - 创建调拨单
 * - GET /merchant/inventory/transfers - 获取调拨单列表
 * - GET /merchant/inventory/transfers/:id - 获取调拨单详情
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
@Controller('merchant/inventory')
@UseGuards(MerchantAuthGuard)
export class MerchantTransfersController {
  constructor(private readonly transfersService: MerchantTransfersService) {}

  @Post('transfers')
  @HttpCode(201)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStockTransferDto,
  ) {
    return this.transfersService.createTransfer(user, dto);
  }

  @Get('transfers')
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: StockTransferListQueryDto) {
    return this.transfersService.listTransfers(user.tenantId!, query);
  }

  @Get('transfers/:id')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.transfersService.getTransfer(user.tenantId!, id);
  }
}
