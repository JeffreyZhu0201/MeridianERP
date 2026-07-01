/**
 * 购物车页面
 *
 * 功能说明:
 * - 展示用户当前购物车的所有商品
 * - 显示商品数量和小计金额
 * - 支持修改商品数量或移除商品
 * - 支持继续购物和去结算操作
 *
 * 使用场景:
 * - 消费者在商店选购商品后查看购物车
 * - 结算前确认商品和数量
 * - 登录用户和非登录用户均可使用
 *
 * 认证说明:
 * - 登录用户: 使用 JWT token 识别用户身份
 * - 非登录用户: 使用 cartSession（会话标识）关联购物车
 *
 * 数据来源:
 * - 购物车: /store/{slug}/cart API
 * - 使用 store i18n 命名空间
 */
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, Button, EmptyState, ListPageFrame } from '@meridian/ui';

import { StoreShellWrapper } from '@/components/store-shell-wrapper';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getServerCartSession } from '@/lib/cart-session.server';
import { getToken } from '@/lib/auth';
import { CartView } from './_components/cart-view';

/**
 * 页面 Props 类型定义
 *
 * @property params - 路由参数，包含:
 *   - slug: 商店的唯一标识符
 */
interface CartPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * 格式化货币金额显示
 */
function formatMoney(value: string | number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(
    Number(value),
  );
}

/**
 * 购物车页面主组件
 *
 * 页面布局:
 * - StoreShellWrapper: 商店前端框架
 * - BentoListHeader: 顶部指标卡片
 * - ListPageFrame: 列表页面框架
 *
 * 核心功能:
 * 1. 认证与会话
 *    - 优先使用 JWT token（已登录用户）
 *    - 次选 cartSession（未登录用户）
 *    - 最后使用 storeSlug 作为匿名标识
 *
 * 2. 指标卡片
 *    - cart.qty: 购物车商品总数量
 *    - cart.subtotal: 购物车商品小计金额
 *
 * 3. 空状态处理
 *    - 购物车为空时显示空状态
 *    - 提供"继续购物"按钮跳转到商店首页
 *
 * 4. CartView 子组件
 *    - 渲染购物车商品列表
 *    - 提供修改数量、移除商品等操作
 *    - 接收 token 用于更新购物车
 *
 * @param params - 路由参数（Promise）
 */
export default async function CartPage({ params }: CartPageProps) {
  const { slug } = await params;
  const token = await getToken();
  const cartSession = token ? undefined : await getServerCartSession(slug);
  const locale = await getLocale();
  const t = await getTranslations('store');

  const cart = await apiFetch<Cart>(
    storePath(slug, 'cart'),
    {},
    token ? token : cartSession ? { cartSession } : { storeSlug: slug },
  ).catch(() => null);
  const storeName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const isEmpty = !cart || cart.items.length === 0;

  return (
    <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[
            { title: t('cart.qty'), value: cartCount },
            {
              title: t('cart.subtotal'),
              value: cart ? formatMoney(cart.subtotal, locale) : formatMoney(0, locale),
            },
          ]}
        />
        <ListPageFrame
          title={t('cart.title')}
          emptyState={
            isEmpty ? (
              <EmptyState
                title={t('cart.empty')}
                action={
                  <Link href={`/s/${slug}`}>
                    <Button>{t('cart.continueShopping')}</Button>
                  </Link>
                }
              />
            ) : undefined
          }
        >
          {cart ? <CartView cart={cart} storeSlug={slug} token={token} /> : null}
        </ListPageFrame>
      </div>
    </StoreShellWrapper>
  );
}
