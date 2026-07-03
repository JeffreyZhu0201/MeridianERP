import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import type { AdminPlatformRole } from '@meridian/shared';

const PLATFORM_ADMIN_ROLES: AdminPlatformRole[] = [
  'SUPER_ADMIN',
  'FINANCE',
  'FULFILLMENT',
  'REVIEWER',
];

export class UpdatePlatformAdminDto {
  @IsOptional()
  @IsIn(PLATFORM_ADMIN_ROLES)
  role?: AdminPlatformRole;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
