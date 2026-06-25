import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { FulfillmentType } from '@prisma/client';

export class DeliveryAddressDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  phone!: string;

  @IsString()
  @MinLength(1)
  line1!: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsString()
  @MinLength(1)
  city!: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;
}

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
  @IsEnum(FulfillmentType)
  fulfillmentType!: FulfillmentType;

  @ValidateIf((o: CheckoutDto) => o.fulfillmentType === FulfillmentType.DELIVERY)
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;
}
