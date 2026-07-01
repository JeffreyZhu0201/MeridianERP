import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ActivityType } from '@prisma/client';

/**
 * CRM 活动 DTO
 *
 * CreateActivityDto - 创建活动记录
 * - type: 活动类型（必填，ActivityType 枚举：CALL/MEETING/EMAIL/NOTE 等）
 * - note: 活动备注（必填）
 * - contactId: 关联联系人ID（可选）
 * - leadId: 关联线索ID（可选）
 */
export class CreateActivityDto {
  @IsEnum(ActivityType)
  type!: ActivityType;

  @IsString()
  @MinLength(1)
  note!: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  leadId?: string;
}
