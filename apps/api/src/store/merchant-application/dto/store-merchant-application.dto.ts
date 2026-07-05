import { IsOptional, IsString, MinLength } from 'class-validator';

export class StoreMerchantApplicationDto {
  @IsOptional()
  @IsString()
  inviteCode?: string;

  @IsString()
  @MinLength(1)
  businessName!: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;
}
