import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { LeadStage } from '@prisma/client';

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
}

export class UpdateLeadStageDto {
  @IsEnum(LeadStage)
  stage!: LeadStage;
}
