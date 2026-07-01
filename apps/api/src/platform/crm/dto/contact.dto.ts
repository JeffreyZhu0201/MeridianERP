import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * 创建平台 CRM 联系人 DTO
 */
export class CreatePlatformCrmContactDto {
  /** 名（必填） */
  @IsString()
  @MinLength(1)
  firstName!: string;

  /** 姓（必填） */
  @IsString()
  @MinLength(1)
  lastName!: string;

  /** 邮箱（可选） */
  @IsOptional()
  @IsEmail()
  email?: string;

  /** 电话（可选） */
  @IsOptional()
  @IsString()
  phone?: string;

  /** 所属公司 ID（可选） */
  @IsOptional()
  @IsString()
  companyId?: string;
}

/**
 * 更新平台 CRM 联系人 DTO
 */
export class UpdatePlatformCrmContactDto {
  /** 名（可选） */
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  /** 姓（可选） */
  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  /** 邮箱（可选） */
  @IsOptional()
  @IsEmail()
  email?: string;

  /** 电话（可选） */
  @IsOptional()
  @IsString()
  phone?: string;

  /** 所属公司 ID（可选，设为 null 可解除关联） */
  @IsOptional()
  @IsString()
  companyId?: string | null;
}
