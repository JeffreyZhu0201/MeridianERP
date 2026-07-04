import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateInviteCodeDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiresInDays?: number;
}
