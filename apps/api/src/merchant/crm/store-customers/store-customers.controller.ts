import { Controller, Get, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/interfaces/jwt-payload.interface';
import { RequiresPlugin } from '../../../plugins/decorators/requires-plugin.decorator';
import { CrmPluginGuard } from '../../../plugins/crm-plugin.guard';
import { StoreCustomersService } from './store-customers.service';

@RequiresPlugin('crm')
@Controller('merchant/crm/store-customers')
@UseGuards(MerchantAuthGuard, CrmPluginGuard)
export class StoreCustomersController {
  constructor(private readonly storeCustomersService: StoreCustomersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.storeCustomersService.findAll(user.tenantId!);
  }
}
