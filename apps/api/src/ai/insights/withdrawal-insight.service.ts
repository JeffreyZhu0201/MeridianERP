import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  AdminAiInsight,
  AiStreamEvent,
  WithdrawalInsightRequest,
} from '@meridian/shared';
import { WithdrawalRequestStatus } from '@prisma/client';
import { PlatformWithdrawalsService } from '../../platform/withdrawals/platform-withdrawals.service';
import { AiLlmStreamService } from '../llm/ai-llm-stream.service';
import { AiLlmService } from '../llm/ai-llm.service';
import type { AdminInsightContext } from '../llm/admin-insight.types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WithdrawalInsightService {
  private readonly logger = new Logger(WithdrawalInsightService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly withdrawals: PlatformWithdrawalsService,
    private readonly aiLlm: AiLlmService,
    private readonly aiLlmStream: AiLlmStreamService,
  ) {}

  async insight(body: WithdrawalInsightRequest): Promise<AdminAiInsight> {
    const context = await this.buildContext(body);
    this.logger.log(`Withdrawal insight id=${body.withdrawalId?.trim()}`);
    const { result } = await this.aiLlm.suggestAdminInsight(context, {
      actorType: 'PLATFORM',
    });
    return result;
  }

  async *insightStream(
    body: WithdrawalInsightRequest,
  ): AsyncGenerator<AiStreamEvent> {
    const context = await this.buildContext(body);
    this.logger.log(
      `Withdrawal insight stream id=${body.withdrawalId?.trim()}`,
    );
    yield* this.aiLlmStream.streamAdminInsight(
      'PLATFORM_WITHDRAWAL_INSIGHT',
      context,
    );
  }

  private async buildContext(
    body: WithdrawalInsightRequest,
  ): Promise<AdminInsightContext> {
    const withdrawalId = body.withdrawalId?.trim();
    if (!withdrawalId) {
      throw new NotFoundException('Withdrawal not found');
    }

    const req = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: { distributor: { select: { name: true, email: true } } },
    });
    if (!req) {
      throw new NotFoundException('Withdrawal not found');
    }

    const availableBalance = await this.withdrawals.getAvailableBalance(
      req.distributorId,
    );
    const pendingCount = await this.prisma.withdrawalRequest.count({
      where: {
        distributorId: req.distributorId,
        status: WithdrawalRequestStatus.PENDING,
      },
    });

    const context: AdminInsightContext = {
      scene: 'withdrawal',
      data: {
        withdrawalId: req.id,
        distributorName: req.distributor.name,
        distributorEmail: req.distributor.email,
        requestedAmount: req.amount.toString(),
        availableBalance: availableBalance.toString(),
        status: req.status,
        note: req.note,
        payoutReference: req.payoutReference,
        payoutError: req.payoutError,
        pendingWithdrawalCount: pendingCount,
      },
    };

    return context;
  }
}
