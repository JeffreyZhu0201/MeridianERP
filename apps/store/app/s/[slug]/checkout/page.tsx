/**
 * 结账页面
 *
 * 功能说明:
 * - 展示购物车商品和结算信息
 * - 选择履约方式（配送/自提）
 * - 填写收货信息或自提信息
 * - 选择支付方式并完成支付
 *
 * 使用场景:
 * - 消费者确认购物车内容后进入结算
 * - 选择配送地址或到店自提时间
 * - 完成 Stripe 支付（mock 模式）
 * - 支付成功后跳转订单确认页
 *
 * 履约类型:
 * - DELIVERY（配送）: 需要填写收货地址
 * - PICKUP（自提）: 需要选择到店自提时间
 *
 * 支付说明:
 * - 使用 Stripe 进行支付
 * - 开发环境支持 mock 模式（STRIPE_SECRET_KEY 含 mock）
 * - 支付成功后创建订单
 *
 * 数据来源:
 * - 购物车: /store/{slug}/cart API
 * - 使用 store i18n 命名空间
 */
import { getTranslations } from 'next-intl/server';
import { FormPageFrame } from '@meridian/ui';

import { StoreShellWrapper } from '@/components/store-shell-wrapper';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getServerCartSession } from '@/lib/cart-session.server';
import { getToken } from '@/lib/auth';
import { CheckoutForm } from './_components/checkout-form';

/**
 * 页面 Props 类型定义
 *
 * @property params - 路由参数，包含:
 *   - slug: 商店的唯一标识符
 */
interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * 结账页面主组件
 *
 * 页面布局:
 * - StoreShellWrapper: 商店前端框架
 * - FormPageFrame: 表单页面框架（居中，最大宽度限制）
 *
 * 核心功能:
 * 1. 认证与会话
 *    - 优先使用 JWT token（已登录用户）
 *    - 次选 cartSession（未登录用户）
 *    - 最后使用 storeSlug 作为匿名标识
 *
 * 2. CheckoutForm 子组件
 *    - 渲染完整的结账表单
 *    - 包含履约方式选择、配送/自提信息填写
 *    - 支付按钮和表单验证
 *    - 接收 cart 数据用于订单创建
 *
 * @param params - 路由参数（Promise）
 */
export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const token = await getToken();
  const cartSession = token ? undefined : await getServerCartSession(slug);
  const t = await getTranslations('store');

  const cart = await apiFetch<Cart>(
    storePath(slug, 'cart'),
    {},
    token ? token : cartSession ? { cartSession } : { storeSlug: slug },
  ).catch(() => null);
  const storeName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
      <FormPageFrame title={t('checkout.title')} className="mx-auto max-w-lg">
        <CheckoutForm storeSlug={slug} cart={cart} token={token} />
      </FormPageFrame>
    </StoreShellWrapper>
  );
}
