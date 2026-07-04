import { IsString, MinLength } from 'class-validator';

export class VerifyPickupDto {
  @IsString()
  @MinLength(1)
  code!: string;
}
