import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminPlatformRole } from '@meridian/shared';
import { PLATFORM_ROLES_KEY } from '../decorators/platform-roles.decorator';
import type { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminPlatformRole[]>(
      PLATFORM_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const role = user?.roles?.[0];
    if (!role || !requiredRoles.includes(role as AdminPlatformRole)) {
      throw new ForbiddenException('Insufficient platform role');
    }

    return true;
  }
}
