/**
 * 商店首页 - 商品目录浏览页面
 *
 * 功能说明:
 * - 展示商店的所有商品目录
 * - 显示商店基本信息（名称、商品数量）
 * - 展示精选商品（Featured）
 * - 实时显示购物车商品数量
 * - 支持跳转到商品详情页和购物车
 *
 * 使用场景:
 * - 消费者选择商店后进入的第一个页面
 * - 浏览商店商品的主要入口
 * - 将商品加入购物车
 *
 * 数据来源:
 * - 商品列表: /store/{slug}/products API
 * - 购物车: /store/{slug}/cart API
 * - 使用 store i18n 命名空间
 *
 * URL 路由: /s/{slug}
 * - slug: 商店的唯一标识符
 */
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  BentoDashboardFrame,
  BentoMetricTile,
  BentoTile,
  EmptyState,
} from '@meridian/ui';

import { StoreShellWrapper } from '@/components/store-shell-wrapper';
import { apiFetch, storePath, type Cart, type Product } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ProductGrid } from './_components/product-grid';

/**
 * 页面 Props 类型定义
 *
 * @property params - 路由参数，包含:
 *   - slug: 商店的唯一标识符（URL 参数）
 *
 * Next.js 15+ 特性:
 * - params 是 Promise 类型，需要在组件中 await
 */
interface StoreHomePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * 计算商品最低起售价
 *
 * @param variants - 商品变体数组
 * @returns 最低价格，如果没有激活的变体则返回 0
 *
 * 功能说明:
 * - 筛选出 isActive 为 true 的变体
 * - 取这些变体价格的最小值
 * - 用于显示 "From $X.XX" 类型的起售价
 *
 * 使用场景:
 * - 显示精选商品的起售价格
 * - 消费者快速了解商品价格范围
 */
function getFromPrice(variants: Product['variants']): number {
  // 筛选激活状态的变体
  const active = variants.filter((variant) => variant.isActive);
  if (active.length === 0) return 0;
  // 取激活变体中的最低价格
  return Math.min(...active.map((variant) => Number(variant.price)));
}

/**
 * 商店首页主组件
 *
 * 页面布局:
 * - StoreShellWrapper: 商店前端框架，包含导航栏和购物车
 * - BentoDashboardFrame: 仪表盘网格布局
 *
 * 核心功能:
 * 1. 数据并行加载
 *    - products: 商店商品列表
 *    - cart: 用户当前购物车数据（已登录用户）
 *    - 两个接口并行调用
 *
 * 2. 页面信息
 *    - storeName: 商店名称（从 slug 首字母大写生成）
 *    - cartCount: 购物车商品总数量
 *    - featured: 第一个商品作为精选推荐
 *
 * 3. 指标卡片
 *    - nav.cart: 购物车商品数量
 *    - Catalog: 商品总数
 *
 * 4. 商品网格 (ProductGrid)
 *    - 渲染商品列表
 *    - 支持添加到购物车
 *    - 接收 storeSlug 用于 API 调用
 *
 * 错误处理:
 * - API 失败时使用空数组/空购物车降级
 * - 商品列表为空时显示空状态
 */
export default async function StoreHomePage({ params }: StoreHomePageProps) {
  const { slug } = await params;
  const token = await getToken();
  const t = await getTranslations('store');

  const [products, cart] = await Promise.all([
    apiFetch<Product[]>(storePath(slug, 'products')).catch(() => []),
    apiFetch<Cart>(storePath(slug, 'cart'), {}, token).catch(() => null),
  ]);

  const storeName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const isEmpty = products.length === 0;
  const featured = products[0];

  return (
    <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
      <BentoDashboardFrame title={t('home.shop')} description={t('home.browseCatalog')}>
        <BentoTile colSpan={2} rowSpan={2}>
          <div className="flex h-full flex-col justify-between gap-4 p-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {storeName}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">{t('home.browseCatalog')}</h2>
              <p className="text-sm text-muted-foreground">
                {products.length} {products.length === 1 ? 'product' : 'products'}
              </p>
            </div>
            {featured ? (
              <div className="rounded-lg ring-1 ring-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Featured</p>
                <Link
                  href={`/s/${slug}/products/${featured.slug}`}
                  className="mt-1 block text-lg font-medium hover:text-primary"
                >
                  {featured.name}
                </Link>
                <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                  From ${getFromPrice(featured.variants).toFixed(2)}
                </p>
              </div>
            ) : null}
          </div>
        </BentoTile>
        <BentoMetricTile title={t('nav.cart')} value={cartCount} />
        <BentoMetricTile title="Catalog" value={products.length} />
        <BentoTile colSpan={4}>
          <div className="p-4 md:p-6">
            {isEmpty ? (
              <EmptyState title={t('home.empty')} />
            ) : (
              <ProductGrid products={products} storeSlug={slug} />
            )}
          </div>
        </BentoTile>
      </BentoDashboardFrame>
    </StoreShellWrapper>
  );
}
