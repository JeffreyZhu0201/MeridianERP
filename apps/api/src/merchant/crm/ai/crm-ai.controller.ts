import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import type { CrmFollowUpRequest } from '@meridian/shared';
import { MerchantAuthGuard } from '../../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/interfaces/jwt-payload.interface';
import { RequiresPlugin } from '../../../plugins/decorators/requires-plugin.decorator';
import { CrmPluginGuard } from '../../../plugins/crm-plugin.guard';
import { CrmFollowUpService } from './crm-follow-up.service';

@RequiresPlugin('crm')
@Controller('merchant/crm/ai')
@UseGuards(MerchantAuthGuard, CrmPluginGuard)
export class CrmAiController {
  constructor(private readonly crmFollowUpService: CrmFollowUpService) {}

  @Post('follow-up')
  @HttpCode(201)
  followUp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CrmFollowUpRequest,
  ) {
    return this.crmFollowUpService.followUp(user.tenantId!, body);
  }
}
