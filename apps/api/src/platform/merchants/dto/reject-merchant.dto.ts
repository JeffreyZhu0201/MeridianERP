import { IsString, MinLength } from 'class-validator';

export class RejectMerchantDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}
