import { IsOptional, IsString, ValidateIf } from 'class-validator';
import type { UpdatePlatformAccountRequest } from '@meridian/shared';

export class UpdatePlatformAccountDto implements UpdatePlatformAccountRequest {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  firstName?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  lastName?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  phone?: string | null;
}
