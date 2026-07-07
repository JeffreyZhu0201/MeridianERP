import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/interfaces/jwt-payload.interface';
import { ReplenishmentAiService } from './replenishment-ai.service';

@Controller('merchant/inventory/ai')
@UseGuards(MerchantAuthGuard)
export class InventoryAiController {
  constructor(private readonly replenishmentAiService: ReplenishmentAiService) {}

  @Post('replenishment')
  @HttpCode(201)
  replenishment(@CurrentUser() user: AuthenticatedUser) {
    return this.replenishmentAiService.suggest(user.tenantId!);
  }
}
