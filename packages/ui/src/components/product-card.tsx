/**
 * ProductCard - 商品卡片组件
 *
 * 用于商店前端展示商品：
 * - 商品图片（带 hover 缩放效果）
 * - 商品名称（hover 时高亮）
 * - 价格（"From xxx" 格式）
 * - 点击跳转到商品详情页
 *
 * @example
 * ```tsx
 * <ProductCard
 *   name="拿铁"
 *   slug="latte"
 *   storeSlug="starbucks-zhongguancun"
 *   priceFrom={28}
 *   imageUrl="https://example.com/latte.jpg"
 * />
 * ```
 */

import Link from 'next/link';
import { cn } from '../lib/utils';

/**
 * ProductCard 属性接口
 * @param name - 商品名称
 * @param slug - 商品 URL slug
 * @param storeSlug - 商店 URL slug
 * @param priceFrom - 起售价格
 * @param imageUrl - 商品图片 URL（可选，无图片时显示占位符）
 * @param className - 自定义样式类名
 */
export interface ProductCardProps {
  name: string;
  slug: string;
  storeSlug: string;
  priceFrom: string | number;
  imageUrl?: string;
  className?: string;
}

/** 格式化价格显示（USD 格式） */
function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

/**
 * 商品卡片组件
 * - 1:1 方形图片区域
 * - 图片 hover 时轻微放大
 * - 商品名称 hover 时高亮
 * - 链接到 /s/{storeSlug}/products/{slug}
 */
export function ProductCard({
  name,
  slug,
  storeSlug,
  priceFrom,
  imageUrl,
  className,
}: ProductCardProps) {
  const href = `/s/${storeSlug}/products/${slug}`;

  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-border transition-shadow hover:shadow-md',
        className,
      )}
    >
      {/* 商品图片 */}
      <div className="aspect-square bg-muted">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <span className="text-xs">No image</span>
          </div>
        )}
      </div>

      {/* 商品信息 */}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-sm font-medium leading-snug group-hover:text-primary">{name}</h3>
        <p className="text-sm text-muted-foreground">From {formatPrice(priceFrom)}</p>
      </div>
    </Link>
  );
}
