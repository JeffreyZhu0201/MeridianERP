import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PLUGIN_NOT_INSTALLED } from '@meridian/shared';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { PluginService } from './plugin.service';

@Injectable()
export class CrmPluginGuard implements CanActivate {
  constructor(private readonly pluginService: PluginService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = context.switchToHttp().getRequest().user as AuthenticatedUser;
    const tenantId = user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException(PLUGIN_NOT_INSTALLED);
    }

    const installed = await this.pluginService.isInstalled(tenantId, 'crm');
    if (!installed) {
      throw new ForbiddenException(PLUGIN_NOT_INSTALLED);
    }

    return true;
  }
}
