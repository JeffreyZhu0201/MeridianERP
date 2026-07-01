import { CommissionType } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * 商户设置更新 DTO
 *
 * UpdateMerchantSettingsDto - 更新商户设置
 * - businessName: 企业名称（可选）
 * - contactEmail: 联系人邮箱（可选）
 * - contactPhone: 联系电话（可选）
 * - defaultCommissionRate: 默认佣金比例（可选，可为 null）
 * - defaultCommissionType: 默认佣金类型（可选，CommissionType 枚举）
 * - notifyOnBinding: 绑定通知（可选）
 * - notifyOnCommission: 佣金通知（可选）
 */
export class UpdateMerchantSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  businessName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsNumber()
  defaultCommissionRate?: number | null;

  @IsOptional()
  @IsEnum(CommissionType)
  defaultCommissionType?: CommissionType | null;

  @IsOptional()
  @IsBoolean()
  notifyOnBinding?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnCommission?: boolean;
}
