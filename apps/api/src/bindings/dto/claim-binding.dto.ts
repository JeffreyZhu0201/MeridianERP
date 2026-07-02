import { IsString } from 'class-validator';

export class ClaimBindingDto {
  
  @IsString()
  token!: string;
}
