import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCustomerDeliveryAddressDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsString()
  line1!: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateCustomerDeliveryAddressDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  line1?: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateStoreCustomerProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class ChangeStorePasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
