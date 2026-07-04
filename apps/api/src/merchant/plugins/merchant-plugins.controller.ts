import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { MerchantPluginCode } from '@meridian/shared';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { MerchantOwnerGuard } from '../../auth/guards/merchant-owner.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PluginService } from '../../plugins/plugin.service';

@Controller('merchant/plugins')
@UseGuards(MerchantAuthGuard)
export class MerchantPluginsController {
  constructor(private readonly pluginService: PluginService) {}

  @Get()
  listCatalog(@CurrentUser() user: AuthenticatedUser) {
    return this.pluginService.listCatalog(user.tenantId!);
  }

  @Get('installed-codes')
  installedCodes(@CurrentUser() user: AuthenticatedUser) {
    return this.pluginService.getInstalledCodes(user.tenantId!);
  }

  @Post(':code/install')
  @HttpCode(201)
  @UseGuards(MerchantOwnerGuard)
  install(
    @CurrentUser() user: AuthenticatedUser,
    @Param('code') code: MerchantPluginCode,
  ) {
    return this.pluginService.install(user.tenantId!, code, user.userId);
  }

  @Delete(':code/uninstall')
  @UseGuards(MerchantOwnerGuard)
  uninstall(
    @CurrentUser() user: AuthenticatedUser,
    @Param('code') code: MerchantPluginCode,
  ) {
    return this.pluginService.uninstall(user.tenantId!, code);
  }
}
