import { Controller, Get, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { MerchantFundsService } from '../../platform/funds/platform-funds.service';

@Controller('merchant/funds')
@UseGuards(MerchantAuthGuard)
export class MerchantFundsController {
  constructor(private readonly service: MerchantFundsService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getSummary(user.tenantId!);
  }
}
