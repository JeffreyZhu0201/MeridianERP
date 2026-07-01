import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * 团队成员管理 DTO
 *
 * CreateTeamMemberDto - 创建团队成员
 * - email: 成员邮箱（唯一）
 * - password: 登录密码（最少8位）
 *
 * UpdateTeamMemberDto - 更新团队成员
 * - password: 新密码（最少8位）
 */
export class CreateTeamMemberDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class UpdateTeamMemberDto {
  @IsString()
  @MinLength(8)
  password!: string;
}
