import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PayoutModule } from '../payout/payout.module';
import { PlatformFundsModule } from '../platform/funds/platform-funds.module';
import { PlatformWithdrawalsModule } from '../platform/withdrawals/platform-withdrawals.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DiagnosisController } from './diagnosis/diagnosis.controller';
import { DiagnosisService } from './diagnosis/diagnosis.service';
import { CommissionDiagnosisTool } from './diagnosis/tools/commission.tool';
import { FundDiagnosisTool } from './diagnosis/tools/fund.tool';
import { InventoryDiagnosisTool } from './diagnosis/tools/inventory.tool';
import { OrderDiagnosisTool } from './diagnosis/tools/order.tool';
import { DeliveryOrderInsightService } from './insights/delivery-order-insight.service';
import { FundsInsightService } from './insights/funds-insight.service';
import { PlatformAiInsightsController } from './insights/platform-ai-insights.controller';
import { WithdrawalInsightService } from './insights/withdrawal-insight.service';
import { AiAnalysisRecordService } from './logging/ai-analysis-record.service';
import { AiCallLogService } from './logging/ai-call-log.service';
import { PlatformAiCallsController } from './logging/platform-ai-calls.controller';
import { AdminInsightMockClient } from './llm/admin-insight-mock.client';
import { AiLlmService } from './llm/ai-llm.service';
import { AiLlmStreamService } from './llm/ai-llm-stream.service';
import { AnthropicLlmClient } from './llm/anthropic-llm.client';
import { CrmFollowUpMockClient } from './llm/crm-follow-up-mock.client';
import { MockLlmClient } from './llm/mock-llm.client';
import { ProductCopyMockClient } from './llm/product-copy-mock.client';
import { ReplenishmentMockClient } from './llm/replenishment-mock.client';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PlatformFundsModule,
    PlatformWithdrawalsModule,
    PayoutModule,
  ],
  controllers: [
    DiagnosisController,
    PlatformAiInsightsController,
    PlatformAiCallsController,
  ],
  providers: [
    DiagnosisService,
    WithdrawalInsightService,
    DeliveryOrderInsightService,
    FundsInsightService,
    AiCallLogService,
    AiAnalysisRecordService,
    AiLlmService,
    AiLlmStreamService,
    MockLlmClient,
    AnthropicLlmClient,
    CrmFollowUpMockClient,
    AdminInsightMockClient,
    ReplenishmentMockClient,
    ProductCopyMockClient,
    OrderDiagnosisTool,
    CommissionDiagnosisTool,
    InventoryDiagnosisTool,
    FundDiagnosisTool,
  ],
  exports: [AiLlmService, AiLlmStreamService, AiAnalysisRecordService],
})
export class AiModule {}
