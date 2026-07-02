import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateTeamMemberDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class UpdateTeamMemberDto {
  @IsString()
  @MinLength(8)
  password!: string;
}
