import { Injectable } from '@nestjs/common';
import { EnvService } from '../config/env.service';

export interface PaymentIntentResult {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

@Injectable()
export class PaymentService {
  constructor(private readonly env: EnvService) {}

  isMockMode(): boolean {
    const key = this.env.get('STRIPE_SECRET_KEY');
    if (!key || key.includes('mock') || key.endsWith('...')) {
      return true;
    }
    return false;
  }

  async createPaymentIntent(params: {
    orderId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntentResult> {
    if (this.isMockMode()) {
      const id = `pi_mock_${params.orderId}`;
      return {
        id,
        clientSecret: `${id}_secret_mock`,
        amount: params.amount,
        currency: params.currency,
      };
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(this.env.getOrThrow('STRIPE_SECRET_KEY'));
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100),
      currency: params.currency.toLowerCase(),
      metadata: {
        orderId: params.orderId,
        ...params.metadata,
      },
      automatic_payment_methods: { enabled: true },
    });
    return {
      id: intent.id,
      clientSecret: intent.client_secret!,
      amount: params.amount,
      currency: params.currency,
    };
  }

  async constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Promise<{
    type: string;
    data: { object: { id: string; metadata?: { orderId?: string } } };
  }> {
    if (this.isMockMode()) {
      const body = JSON.parse(payload.toString()) as {
        type: string;
        data: { object: { id: string; metadata?: { orderId?: string } } };
      };
      return body;
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(this.env.getOrThrow('STRIPE_SECRET_KEY'));
    const secret = this.env.getOrThrow('STRIPE_WEBHOOK_SECRET');
    return stripe.webhooks.constructEvent(payload, signature, secret) as {
      type: string;
      data: { object: { id: string; metadata?: { orderId?: string } } };
    };
  }

  async refundPaymentIntent(paymentIntentId: string): Promise<{ id: string }> {
    if (this.isMockMode()) {
      return { id: `re_mock_${paymentIntentId}` };
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(this.env.getOrThrow('STRIPE_SECRET_KEY'));
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
    return { id: refund.id };
  }
}
