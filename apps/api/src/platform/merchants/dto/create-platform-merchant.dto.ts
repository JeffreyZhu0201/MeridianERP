import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreatePlatformMerchantDto {
  @IsString()
  @MinLength(1)
  businessName!: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsEmail()
  contactEmail!: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  ownerAccountId!: string;

  @IsOptional()
  @IsString()
  recruitedByDistributorId?: string;

  @IsOptional()
  @IsBoolean()
  autoApprove?: boolean;
}
