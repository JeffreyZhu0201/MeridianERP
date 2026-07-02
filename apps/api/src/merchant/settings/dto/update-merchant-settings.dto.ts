import { CommissionType } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateMerchantSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  businessName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsNumber()
  defaultCommissionRate?: number | null;

  @IsOptional()
  @IsEnum(CommissionType)
  defaultCommissionType?: CommissionType | null;

  @IsOptional()
  @IsBoolean()
  notifyOnBinding?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnCommission?: boolean;
}
