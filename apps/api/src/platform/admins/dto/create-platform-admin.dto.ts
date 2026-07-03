import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import type { AdminPlatformRole } from '@meridian/shared';

const PLATFORM_ADMIN_ROLES: AdminPlatformRole[] = [
  'SUPER_ADMIN',
  'FINANCE',
  'FULFILLMENT',
  'REVIEWER',
];

export class CreatePlatformAdminDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(PLATFORM_ADMIN_ROLES)
  role!: AdminPlatformRole;
}
