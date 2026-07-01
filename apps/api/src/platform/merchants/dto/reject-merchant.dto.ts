import { IsOptional, IsString, MinLength } from 'class-validator';

/**
 * 拒绝商户申请 DTO
 */
export class RejectMerchantDto {
  /** 拒绝原因（必填，最小3个字符） */
  @IsString()
  @MinLength(3)
  reason!: string;
}
