/**
 * StoreCheckoutController - 商店结账控制器
 *
 * 处理商店前端的下单和支付相关请求，包括：
 * - POST /store/:slug/checkout - 创建订单（结账）
 * - POST /store/webhooks/stripe - Stripe Webhook 回调
 * - POST /store/:slug/orders/:orderId/simulate-payment - 模拟支付（仅 Mock 模式）
 *
 * 认证说明：
 * - 结账接口使用 OptionalStoreAuthGuard，支持游客和已登录用户
 * - Webhook 和模拟支付接口为公开接口
 *
 * @controller StoreCheckoutController
 */

import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { OptionalStoreAuthGuard } from '../../auth/guards/optional-store-auth.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PaymentService } from '../../payment/payment.service';
import { CheckoutDto } from '../cart/dto/cart.dto';
import { StoreTenantService } from '../common/store-tenant.service';
import { StoreCheckoutService } from './store-checkout.service';

/**
 * 商店结账控制器
 * 提供下单和支付功能的 HTTP 端点
 */
@Controller('store')
export class StoreCheckoutController {
  /**
   * 构造函数 - 注入所需服务
   * @param checkoutService - 结账服务
   * @param paymentService - 支付服务
   * @param storeTenant - 商店租户解析服务
   */
  constructor(
    private readonly checkoutService: StoreCheckoutService,
    private readonly paymentService: PaymentService,
    private readonly storeTenant: StoreTenantService,
  ) {}

  /**
   * 结账接口
   *
   * 功能：创建订单并返回 Stripe PaymentIntent
   * 支持已登录用户和游客两种模式
   *
   * @route POST /store/:slug/checkout
   * @param slug - 商户商店的 URL 标识
   * @param dto - 结账信息（履约类型、配送地址、游客邮箱）
   * @param sessionId - 游客会话 ID（通过 x-cart-session header 传递）
   * @param user - 当前用户（可选，OptionalStoreAuthGuard 提供）
   * @returns 201 - 订单信息和 PaymentIntent
   * @throws BadRequestException - 购物车为空或缺少必需字段
   */
  @Public()
  @UseGuards(OptionalStoreAuthGuard)
  @Post(':slug/checkout')
  @HttpCode(201)
  checkout(
    @Param('slug') slug: string,
    @Body() dto: CheckoutDto,
    @Headers('x-cart-session') sessionId: string | undefined,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.checkoutService.checkout(slug, dto, sessionId, user);
  }

  /**
   * Stripe Webhook 回调接口
   *
   * 功能：接收 Stripe 发送的 Webhook 事件
   * 目前处理 payment_intent.succeeded 事件
   *
   * @route POST /store/webhooks/stripe
   * @param req - 包含原始请求体的请求对象
   * @param signature - Stripe Webhook 签名
   * @param body - Webhook 事件体
   * @returns 200 - { received: true }
   */
  @Public()
  @Post('webhooks/stripe')
  @HttpCode(200)
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
    @Body() body: { type?: string; data?: { object?: { id: string; metadata?: { orderId?: string } } } },
  ) {
    // 获取原始请求体用于验证签名
    const payload = req.rawBody ?? Buffer.from(JSON.stringify(body));

    // 验证并解析 Webhook 事件
    const event = await this.paymentService.constructWebhookEvent(
      payload,
      signature ?? 'mock',
    );

    // 处理支付成功事件
    if (event.type === 'payment_intent.succeeded') {
      await this.checkoutService.confirmPaymentByIntent(event.data.object.id);
    }

    return { received: true };
  }

  /**
   * 模拟支付接口（仅 Mock 模式）
   *
   * 功能：在开发/测试环境中模拟用户完成支付
   * 仅在 PaymentService 处于 Mock 模式时可用
   *
   * @route POST /store/:slug/orders/:orderId/simulate-payment
   * @param slug - 商户商店的 URL 标识
   * @param orderId - 订单 ID
   * @returns 200 - { orderId, status: 'PAID' }
   * @throws ForbiddenException - 非 Mock 模式下调用
   */
  @Public()
  @Post(':slug/orders/:orderId/simulate-payment')
  @HttpCode(200)
  async simulatePayment(
    @Param('slug') slug: string,
    @Param('orderId') orderId: string,
  ) {
    // 解析商户商店以获取 tenantId
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    return this.checkoutService.confirmPaymentByOrderId(slug, orderId, tenant.id);
  }
}
