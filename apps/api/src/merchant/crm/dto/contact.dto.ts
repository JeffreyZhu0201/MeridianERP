import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * CRM 联系人 DTO
 *
 * CreateContactDto - 创建联系人
 * - firstName: 名（必填）
 * - lastName: 姓（必填）
 * - email: 邮箱（可选）
 * - phone: 电话（可选）
 * - companyId: 关联企业ID（可选）
 *
 * UpdateContactDto - 更新联系人
 * - firstName, lastName, email, phone, companyId（均为可选）
 */
export class CreateContactDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}
