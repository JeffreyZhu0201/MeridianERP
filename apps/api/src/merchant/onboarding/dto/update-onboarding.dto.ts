import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateOnboardingDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  businessName?: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;
}
