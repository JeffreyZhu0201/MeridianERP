import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class DistributorLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  tenantSlug?: string;
}
