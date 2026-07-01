import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { LeadStage } from '@prisma/client';

/**
 * 创建平台 CRM 线索 DTO
 */
export class CreatePlatformCrmLeadDto {
  /** 线索标题（必填） */
  @IsString()
  @MinLength(1)
  title!: string;

  /** 关联联系人 ID（可选） */
  @IsOptional()
  @IsString()
  contactId?: string;

  /** 线索来源（可选，如：官网、展会、推荐等） */
  @IsOptional()
  @IsString()
  source?: string;
}

/**
 * 更新平台 CRM 线索 DTO
 */
export class UpdatePlatformCrmLeadDto {
  /** 线索标题（可选） */
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  /** 关联联系人 ID（可选，设为 null 可解除关联） */
  @IsOptional()
  @IsString()
  contactId?: string | null;

  /** 线索来源（可选） */
  @IsOptional()
  @IsString()
  source?: string;

  /** 线索阶段（可选，用于阶段流转） */
  @IsOptional()
  @IsEnum(LeadStage)
  stage?: LeadStage;
}
