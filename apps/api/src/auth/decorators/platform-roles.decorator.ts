import { SetMetadata } from '@nestjs/common';
import type { AdminPlatformRole } from '@meridian/shared';

export const PLATFORM_ROLES_KEY = 'platform_roles';

export const PlatformRoles = (...roles: AdminPlatformRole[]) =>
  SetMetadata(PLATFORM_ROLES_KEY, roles);
