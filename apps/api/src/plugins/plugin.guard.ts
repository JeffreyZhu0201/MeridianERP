import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { MerchantPluginCode } from '@meridian/shared';
import { PLUGIN_NOT_INSTALLED } from '@meridian/shared';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { REQUIRES_PLUGIN_KEY } from './decorators/requires-plugin.decorator';
import { PluginService } from './plugin.service';

@Injectable()
export class PluginGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly pluginService: PluginService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const code = this.reflector.getAllAndOverride<MerchantPluginCode>(
      REQUIRES_PLUGIN_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!code) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const tenantId = user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException(PLUGIN_NOT_INSTALLED);
    }

    const installed = await this.pluginService.isInstalled(tenantId, code);
    if (!installed) {
      throw new ForbiddenException(PLUGIN_NOT_INSTALLED);
    }

    return true;
  }
}
