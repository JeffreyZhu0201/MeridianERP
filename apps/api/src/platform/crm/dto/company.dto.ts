import { IsOptional, IsString, MinLength } from 'class-validator';

/**
 * 创建平台 CRM 公司 DTO
 */
export class CreatePlatformCrmCompanyDto {
  /** 公司名称（必填，最小1个字符） */
  @IsString()
  @MinLength(1)
  name!: string;

  /** 公司网站（可选） */
  @IsOptional()
  @IsString()
  website?: string;
}

/**
 * 更新平台 CRM 公司 DTO
 */
export class UpdatePlatformCrmCompanyDto {
  /** 公司名称（可选，最小1个字符） */
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  /** 公司网站（可选） */
  @IsOptional()
  @IsString()
  website?: string;
}
