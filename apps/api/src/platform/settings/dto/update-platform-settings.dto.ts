import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * 更新平台设置 DTO
 */
export class UpdatePlatformSettingsDto {
  /** 平台名称（可选，最小2个字符） */
  @IsOptional()
  @IsString()
  @MinLength(2)
  platformName?: string;

  /** 支持邮箱（可选，有效邮箱格式） */
  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  /** 是否启用经销商门户（可选） */
  @IsOptional()
  @IsBoolean()
  distributorPortalEnabled?: boolean;

  /** 是否启用邮件队列（可选，禁用则同步发送） */
  @IsOptional()
  @IsBoolean()
  emailQueueEnabled?: boolean;
}
