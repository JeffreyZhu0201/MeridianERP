import { IsEmail, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class AddCartItemDto {
  @IsString()
  @MinLength(1)
  variantId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CheckoutDto {
  @IsOptional()
  @IsEmail()
  guestEmail?: string;
}
