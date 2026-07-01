import { IsOptional, IsString, MinLength } from 'class-validator';

/**
 * 更新入驻资料 DTO
 *
 * UpdateOnboardingDto - 更新商户入驻资料
 * - businessName: 企业名称（可选，最少2字符）
 * - legalName: 法人名称（可选）
 * - contactPhone: 联系电话（可选）
 */
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
