import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { BindType, CommissionType } from '@prisma/client';

/**
 * 经销商管理 DTO
 *
 * CreateDistributorDto - 创建经销商
 * - name: 经销商名称
 * - email: 邮箱（可选）
 * - phone: 电话（可选）
 * - commissionRate: 佣金比例（可选）
 * - commissionType: 佣金类型（可选，PERCENT 等）
 *
 * UpdateDistributorDto - 更新经销商
 * - name, email, phone, commissionRate, commissionType: 可选更新字段
 * - isActive: 是否激活（可选）
 *
 * GenerateQrDto - 生成二维码
 * - bindType: 绑定类型（MERCHANT/CUSTOMER，默认 MERCHANT）
 * - expiresInDays: 有效期天数（默认7，最大90）
 *
 * QrHistoryListQueryDto - 二维码历史查询
 * - page, limit: 分页参数
 * - bindType: 按绑定类型筛选
 */
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

  @IsOptional()
  @IsNumber()
  commissionRate?: number;

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  expiresInDays?: number;
}

export class QrHistoryListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(BindType)
  bindType?: BindType;
}
