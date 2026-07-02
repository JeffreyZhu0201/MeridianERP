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

@Controller('store')
export class StoreCheckoutController {
  
  constructor(
    private readonly checkoutService: StoreCheckoutService,
    private readonly paymentService: PaymentService,
    private readonly storeTenant: StoreTenantService,
  ) {}

  
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

  
  @Public()
  @Post('webhooks/stripe')
  @HttpCode(200)
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
    @Body() body: { type?: string; data?: { object?: { id: string; metadata?: { orderId?: string } } } },
  ) {
    const payload = req.rawBody ?? Buffer.from(JSON.stringify(body));
    const event = await this.paymentService.constructWebhookEvent(
      payload,
      signature ?? 'mock',
    );
    if (event.type === 'payment_intent.succeeded') {
      await this.checkoutService.confirmPaymentByIntent(event.data.object.id);
    }

    return { received: true };
  }

  
  @Public()
  @Post(':slug/orders/:orderId/simulate-payment')
  @HttpCode(200)
  async simulatePayment(
    @Param('slug') slug: string,
    @Param('orderId') orderId: string,
  ) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    return this.checkoutService.confirmPaymentByOrderId(slug, orderId, tenant.id);
  }
}
