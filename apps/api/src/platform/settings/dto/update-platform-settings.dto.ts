import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdatePlatformSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  platformName?: string;
  @IsOptional()
  @IsEmail()
  supportEmail?: string;
  @IsOptional()
  @IsBoolean()
  distributorPortalEnabled?: boolean;
  @IsOptional()
  @IsBoolean()
  emailQueueEnabled?: boolean;
}
