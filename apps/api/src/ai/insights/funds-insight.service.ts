import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type {
  AdminAiFundsMetric,
  AdminAiInsight,
  AiStreamEvent,
  FundsInsightRequest,
} from '@meridian/shared';
import { PlatformFundsService } from '../../platform/funds/platform-funds.service';
import { AiLlmStreamService } from '../llm/ai-llm-stream.service';
import { AiLlmService } from '../llm/ai-llm.service';
import type { AdminInsightContext } from '../llm/admin-insight.types';

const VALID_METRICS: AdminAiFundsMetric[] = [
  'inventory-cost',
  'expected-profit',
  'procurement',
  'commissions',
  'net-profit',
];

@Injectable()
export class FundsInsightService {
  private readonly logger = new Logger(FundsInsightService.name);

  constructor(
    private readonly funds: PlatformFundsService,
    private readonly aiLlm: AiLlmService,
    private readonly aiLlmStream: AiLlmStreamService,
  ) {}

  async insight(body: FundsInsightRequest): Promise<AdminAiInsight> {
    const context = await this.buildContext(body);
    this.logger.log(`Funds insight metric=${body.metric}`);
    const { result } = await this.aiLlm.suggestAdminInsight(context, {
      actorType: 'PLATFORM',
    });
    return result;
  }

  async *insightStream(
    body: FundsInsightRequest,
  ): AsyncGenerator<AiStreamEvent> {
    const context = await this.buildContext(body);
    this.logger.log(`Funds insight stream metric=${body.metric}`);
    yield* this.aiLlmStream.streamAdminInsight('PLATFORM_FUNDS_INSIGHT', context);
  }

  private async buildContext(
    body: FundsInsightRequest,
  ): Promise<AdminInsightContext> {
    const metric = body.metric;
    if (!metric || !VALID_METRICS.includes(metric)) {
      throw new BadRequestException('Invalid funds metric');
    }

    const query = { from: body.from, to: body.to };
    let contextData: Record<string, unknown> = { metric };

    switch (metric) {
      case 'inventory-cost': {
        const detail = await this.funds.getInventoryCostDetail();
        contextData = {
          metric,
          summaryValue: detail.totalCost,
          breakdown: {
            totalCost: detail.totalCost,
            skuCount: detail.meta.total,
          },
        };
        break;
      }
      case 'expected-profit': {
        const detail = await this.funds.getExpectedProfitDetail();
        contextData = {
          metric,
          summaryValue: detail.totalExpectedProfit,
          breakdown: {
            totalExpectedProfit: detail.totalExpectedProfit,
            skuCount: detail.meta.total,
          },
        };
        break;
      }
      case 'procurement': {
        const detail = await this.funds.getProcurementDetail(query);
        contextData = {
          metric,
          from: detail.from,
          to: detail.to,
          summaryValue: detail.totalProfit,
          breakdown: {
            totalSales: detail.totalSales,
            totalProfit: detail.totalProfit,
            orderCount: detail.meta.total,
          },
        };
        break;
      }
      case 'commissions': {
        const detail = await this.funds.getCommissionsDetail(query);
        contextData = {
          metric,
          from: detail.from,
          to: detail.to,
          summaryValue: detail.totalCommissions,
          breakdown: { totalCommissions: detail.totalCommissions },
        };
        break;
      }
      case 'net-profit': {
        const detail = await this.funds.getNetProfitBreakdown(query);
        contextData = {
          metric,
          from: detail.from,
          to: detail.to,
          summaryValue: detail.netProfit,
          netProfit: detail.netProfit,
          breakdown: {
            totalRevenue: detail.totalRevenue,
            totalCogs: detail.totalCogs,
            distributorCommissions: detail.distributorCommissions,
            netProfit: detail.netProfit,
          },
        };
        break;
      }
    }

    const context: AdminInsightContext = { scene: 'funds', data: contextData };
    return context;
  }
}
