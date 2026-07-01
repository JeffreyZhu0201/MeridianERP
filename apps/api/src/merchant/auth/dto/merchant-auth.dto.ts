import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * 商户认证 DTO
 *
 * MerchantRegisterDto - 商户注册请求
 * - email: 商户用户邮箱（唯一，用于登录）
 * - password: 密码（最少8位）
 * - businessName: 企业名称
 * - legalName: 法人名称（可选）
 * - contactEmail: 联系人邮箱（可选，默认同 email）
 * - contactPhone: 联系人电话（可选）
 * - inviteCode: 经销商邀请码（可选，用于绑定分销渠道）
 *
 * MerchantLoginDto - 商户登录请求
 * - email: 邮箱
 * - password: 密码
 */
export class MerchantRegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  businessName!: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  inviteCode?: string;
}

export class MerchantLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
