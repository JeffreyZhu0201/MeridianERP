import { IsOptional, IsString, MinLength } from 'class-validator';

/**
 * CRM 企业 DTO
 *
 * CreateCompanyDto - 创建企业
 * - name: 企业名称（必填）
 * - website: 企业网站（可选）
 *
 * UpdateCompanyDto - 更新企业
 * - name: 企业名称（可选）
 * - website: 企业网站（可选）
 */
export class CreateCompanyDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  website?: string;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  website?: string;
}
