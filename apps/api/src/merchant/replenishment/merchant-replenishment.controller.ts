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
