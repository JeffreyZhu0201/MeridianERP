import { IsString, MinLength } from 'class-validator';

export class EnablePortalDto {
  @IsString()
  @MinLength(8)
  password!: string;
}
