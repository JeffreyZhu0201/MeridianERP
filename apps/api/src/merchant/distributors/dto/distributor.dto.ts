import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { BindType, CommissionType } from '@prisma/client';

export class CreateDistributorDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNumber()
  commissionRate!: number;

  @IsOptional()
  @IsEnum(CommissionType)
  commissionType?: CommissionType;
}

export class UpdateDistributorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @IsOptional()
  @IsEnum(CommissionType)
  commissionType?: CommissionType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GenerateQrDto {
  @IsOptional()
  @IsEnum(BindType)
  bindType?: BindType;
}
