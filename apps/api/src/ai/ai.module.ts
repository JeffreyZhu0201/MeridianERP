import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DiagnosisController } from './diagnosis/diagnosis.controller';
import { DiagnosisService } from './diagnosis/diagnosis.service';
import { CommissionDiagnosisTool } from './diagnosis/tools/commission.tool';
import { FundDiagnosisTool } from './diagnosis/tools/fund.tool';
import { InventoryDiagnosisTool } from './diagnosis/tools/inventory.tool';
import { OrderDiagnosisTool } from './diagnosis/tools/order.tool';
import { MockLlmClient } from './llm/mock-llm.client';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DiagnosisController],
  providers: [
    DiagnosisService,
    MockLlmClient,
    OrderDiagnosisTool,
    CommissionDiagnosisTool,
    InventoryDiagnosisTool,
    FundDiagnosisTool,
  ],
})
export class AiModule {}
