import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CommissionType } from '@prisma/client';

export class CreatePlatformDistributorDto {
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
  @IsString()
  accountId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  commissionRate!: number;

  @IsOptional()
  @IsEnum(CommissionType)
  commissionType?: CommissionType;
}
