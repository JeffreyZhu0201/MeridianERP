import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class StoreMerchantApplicationDto {
  @IsString()
  @IsNotEmpty()
  inviteCode!: string;

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
