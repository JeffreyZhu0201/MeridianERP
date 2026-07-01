import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { LeadStage } from '@prisma/client';

/**
 * CRM 线索 DTO
 *
 * CreateLeadDto - 创建线索
 * - title: 线索标题（必填）
 * - contactId: 关联联系人ID（可选）
 * - source:线索来源（可选，如"官网"、"展会"等）
 * - distributorId: 关联经销商ID（可选）
 *
 * UpdateLeadStageDto - 更新线索阶段
 * - stage: 新的阶段（必填，LeadStage 枚举：NEW/QUALIFIED/PROPOSAL/NEGOTIATION/WON/LOST）
 */
export class CreateLeadDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  distributorId?: string;
}

export class UpdateLeadStageDto {
  @IsEnum(LeadStage)
  stage!: LeadStage;
}
