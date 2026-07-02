import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePlatformCrmCompanyDto {
  @IsString()
  @MinLength(1)
  name!: string;
  @IsOptional()
  @IsString()
  website?: string;
}

export class UpdatePlatformCrmCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
  @IsOptional()
  @IsString()
  website?: string;
}
