import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProcurementReceivingAddressDto {
  @IsString()
  @MinLength(1)
  label!: string;

  @IsString()
  @MinLength(1)
  contactName!: string;

  @IsString()
  @MinLength(1)
  contactPhone!: string;

  @IsString()
  @MinLength(1)
  address!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateProcurementReceivingAddressDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  label?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  address?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
