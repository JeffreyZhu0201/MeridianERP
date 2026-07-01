import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 商品目录 DTO 定义
 *
 * CreateCategoryDto / UpdateCategoryDto - 分类创建和更新
 * - name: 分类名称
 * - parentId: 父分类ID（可选，用于构建层级分类）
 *
 * ProductVariantDto - 商品变体
 * - sku: 库存单位编码
 * - name: 变体名称（如颜色、尺寸）
 * - price: 售价
 * - inventory: 初始库存（可选）
 * - isActive: 是否启用（可选）
 *
 * CreateProductDto / UpdateProductDto - 商品创建和更新
 * - name: 商品名称
 * - description: 商品描述（可选）
 * - categoryId: 分类ID（可选）
 * - isPublished: 是否发布（可选）
 * - variants: 变体列表
 */
export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;
}

export class ProductVariantDto {
  @IsString()
  @MinLength(1)
  sku!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  inventory?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants!: ProductVariantDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}
