/**
 * 购物车和结账模块的数据传输对象（DTO）
 *
 * 定义购物车操作和结账流程的请求参数格式和验证规则。
 *
 * @module cart dto
 */

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

/**
 * 配送地址 DTO
 *
 * 当履约类型为配送（DELIVERY）时必须提供。
 * 包含收件人信息和配送地址。
 *
 * @example
 * {
 *   name: "张三",
 *   phone: "13800138000",
 *   line1: "朝阳区建国路88号",
 *   line2: "SOHO现代城",
 *   city: "北京市",
 *   province: "北京市",
 *   postalCode: "100022"
 * }
 */
export class DeliveryAddressDto {
  /** 收件人姓名 - 必填 */
  @IsString()
  @MinLength(1)
  name!: string;

  /** 收件人电话 - 必填 */
  @IsString()
  @MinLength(1)
  phone!: string;

  /** 地址行1（街道、门牌号等）- 必填 */
  @IsString()
  @MinLength(1)
  line1!: string;

  /** 地址行2（单元、楼层等）- 可选 */
  @IsOptional()
  @IsString()
  line2?: string;

  /** 城市 - 必填 */
  @IsString()
  @MinLength(1)
  city!: string;

  /** 省份/州 - 可选 */
  @IsOptional()
  @IsString()
  province?: string;

  /** 邮政编码 - 可选 */
  @IsOptional()
  @IsString()
  postalCode?: string;
}

/**
 * 添加购物车商品 DTO
 *
 * 用于将商品规格添加到购物车。
 *
 * @example
 * {
 *   variantId: "var_xxx",
 *   quantity: 2
 * }
 */
export class AddCartItemDto {
  /** 商品规格 ID - 必填，用于标识具体的 SKU/规格 */
  @IsString()
  @MinLength(1)
  variantId!: string;

  /** 商品数量 - 必填，最小值为 1 */
  @IsInt()
  @Min(1)
  quantity!: number;
}

/**
 * 更新购物车商品数量 DTO
 *
 * 用于修改购物车中某商品的数量。
 *
 * @example
 * {
 *   quantity: 3
 * }
 */
export class UpdateCartItemDto {
  /** 新的商品数量 - 必填，最小值为 1 */
  @IsInt()
  @Min(1)
  quantity!: number;
}

/**
 * 结账 DTO
 *
 * 包含下单所需的所有信息：
 * - 履约类型（自提或配送）
 * - 配送地址（配送模式必需）
 * - 游客邮箱（未登录用户必需）
 *
 * @example
 * // 自提模式
 * {
 *   fulfillmentType: "PICKUP"
 * }
 *
 * // 配送模式
 * {
 *   fulfillmentType: "DELIVERY",
 *   deliveryAddress: {
 *     name: "张三",
 *     phone: "13800138000",
 *     line1: "朝阳区建国路88号",
 *     city: "北京市"
 *   }
 * }
 *
 * // 游客结账
 * {
 *   fulfillmentType: "PICKUP",
 *   guestEmail: "guest@example.com"
 * }
 */
export class CheckoutDto {
  /** 履约类型 - 必填，必须是 PICKUP 或 DELIVERY */
  @IsEnum(FulfillmentType)
  fulfillmentType!: FulfillmentType;

  /** 配送地址 - 当 fulfillmentType 为 DELIVERY 时必需 */
  @ValidateIf((o: CheckoutDto) => o.fulfillmentType === FulfillmentType.DELIVERY)
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;

  /** 游客邮箱 - 未登录用户结账时必需 */
  @IsOptional()
  @IsEmail()
  guestEmail?: string;
}
