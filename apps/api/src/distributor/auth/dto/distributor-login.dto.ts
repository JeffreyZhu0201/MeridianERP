import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * 经销商登录请求 DTO
 *
 * 用于验证经销商登录请求的参数。
 */
export class DistributorLoginDto {
  /**
   * 经销商邮箱
   *
   * 必须是一个有效的邮箱格式。
   * 用于在数据库中查找经销商记录。
   */
  @IsEmail()
  email!: string;

  /**
   * 密码
   *
   * 最少 6 个字符。
   * 将与数据库中存储的 bcrypt 哈希进行比对验证。
   */
  @IsString()
  @MinLength(6)
  password!: string;

  /**
   * 商户 Slug（可选）
   *
   * 当同一邮箱在多个商户下存在经销商账户时，
   * 需要通过此字段指定具体的商户。
   *
   * 平台级经销商（tenantId=null）不需要此字段。
   */
  @IsOptional()
  @IsString()
  tenantSlug?: string;
}
