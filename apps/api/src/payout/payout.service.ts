import { BadRequestException, Injectable } from '@nestjs/common';
import { EnvService } from '../config/env.service';

export interface PayoutDisburseInput {
  withdrawalId: string;
  amount: string;
  payeeEmail?: string | null;
}

export interface PayoutDisburseResult {
  provider: string;
  reference: string;
  disbursedAt: Date;
}

@Injectable()
export class PayoutService {
  constructor(private readonly env: EnvService) {}

  isMockMode(): boolean {
    const provider = this.env.get('PAYOUT_PROVIDER', 'mock');
    return provider === 'mock' || !provider;
  }

  async disburse(input: PayoutDisburseInput): Promise<PayoutDisburseResult> {
    await Promise.resolve();
    if (this.env.get('PAYOUT_MOCK_FAIL') === 'true') {
      throw new BadRequestException(
        'Mock payout provider rejected disbursement',
      );
    }

    if (!this.isMockMode()) {
      throw new BadRequestException('Only mock payout provider is configured');
    }

    return {
      provider: 'mock',
      reference: `mock_payout_${input.withdrawalId}`,
      disbursedAt: new Date(),
    };
  }
}
