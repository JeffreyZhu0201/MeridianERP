import { IsString, MinLength } from 'class-validator';

/**
 * 开通经销商门户 DTO
 *
 * EnablePortalDto - 为经销商开通门户访问
 * - password: 登录密码（最少8位）
 */
export class EnablePortalDto {
  @IsString()
  @MinLength(8)
  password!: string;
}
