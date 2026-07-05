import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';


export class StoreRegisterDto {
  @IsEmail()
  email!: string; // 邮箱
  @IsString()
  @MinLength(8) // 密码长度至少8位
  password!: string; // 密码
  @IsOptional()
  @IsString()
  firstName?: string; // 名
  @IsOptional()
  @IsString()
  lastName?: string; // 姓
}

/**
 * @description: 店铺登录DTO
 * @return {StoreLoginDto}
 * @author {Jeffrey Zhu}
 * @date {2026-07-05 15:29:17}
 * @version {1.0.0}
 * @example
 * const dto = new StoreLoginDto();
 */  
export class StoreLoginDto {
  @IsEmail()
  email!: string; // 邮箱
  @IsString()
  @MinLength(6) // 密码长度至少6位
  password!: string; // 密码
}
