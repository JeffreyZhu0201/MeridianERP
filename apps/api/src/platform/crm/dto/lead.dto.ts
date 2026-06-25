import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { LeadStage } from '@prisma/client';

export class CreatePlatformCrmLeadDto {
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

export class UpdatePlatformCrmLeadDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  contactId?: string | null;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsEnum(LeadStage)
  stage?: LeadStage;
}
