import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { MerchantReplenishmentService } from './merchant-replenishment.service';

/**
 * 商户补货请求控制器 (MerchantReplenishmentController)
 *
 * 提供补货请求管理 API：
 * - GET /merchant/replenishment - 获取补货请求列表
 * - GET /merchant/replenishment/master-skus - 获取可用主 SKU 列表
 * - POST /merchant/replenishment - 创建补货请求
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
@Controller('merchant/replenishment')
@UseGuards(MerchantAuthGuard)
export class MerchantReplenishmentController {
  constructor(private readonly service: MerchantReplenishmentService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.list(user.tenantId!);
  }

  @Get('master-skus')
  listSkus() {
    return this.service.listAvailableSkus();
  }

  @Post()
  @HttpCode(201)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    dto: {
      note?: string;
      lines: Array<{ masterSkuId: string; quantity: number }>;
    },
  ) {
    return this.service.create(user.tenantId!, dto.lines, dto.note);
  }
}
