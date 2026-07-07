import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { DiagnosisRequest, DiagnosisResult } from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AiLlmService } from '../llm/ai-llm.service';
import type { ToolRunResult } from '../llm/tool-run-result';
import { CommissionDiagnosisTool } from './tools/commission.tool';
import { FundDiagnosisTool } from './tools/fund.tool';
import { InventoryDiagnosisTool } from './tools/inventory.tool';
import { OrderDiagnosisTool } from './tools/order.tool';

interface ParsedQuery {
  orderId?: string;
  tenantId?: string;
  tenantSlug?: string;
  allocationOrderId?: string;
  skuCode?: string;
  runOrder: boolean;
  runCommission: boolean;
  runInventory: boolean;
  runFund: boolean;
}

@Injectable()
export class DiagnosisService {
  private readonly logger = new Logger(DiagnosisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orderTool: OrderDiagnosisTool,
    private readonly commissionTool: CommissionDiagnosisTool,
    private readonly inventoryTool: InventoryDiagnosisTool,
    private readonly fundTool: FundDiagnosisTool,
    private readonly llm: AiLlmService,
  ) {}

  async diagnose(
    body: DiagnosisRequest,
    platformUserId: string,
  ): Promise<DiagnosisResult> {
    const query = body.query?.trim();
    if (!query) {
      throw new BadRequestException('query is required');
    }

    this.logger.log(
      `AI diagnosis query="${query.slice(0, 120)}" userId=${platformUserId}`,
    );

    const parsed = await this.parseQuery(query);
    const toolRuns: ToolRunResult[] = [];

    if (parsed.runOrder) {
      toolRuns.push({
        domain: 'order',
        title: '订单状态',
        result: await this.orderTool.execute({
          orderId: parsed.orderId,
          tenantId: parsed.tenantId,
        }),
      });
    }

    if (parsed.runCommission) {
      toolRuns.push({
        domain: 'commission',
        title: '佣金台账',
        result: await this.commissionTool.execute({
          orderId: parsed.orderId,
          tenantId: parsed.tenantId,
          allocationOrderId: parsed.allocationOrderId,
        }),
      });
    }

    if (parsed.runInventory) {
      toolRuns.push({
        domain: 'inventory',
        title: '库存水位',
        result: await this.inventoryTool.execute({
          tenantId: parsed.tenantId,
          skuCode: parsed.skuCode,
        }),
      });
    }

    if (parsed.runFund) {
      toolRuns.push({
        domain: 'fund',
        title: '资金头寸',
        result: await this.fundTool.execute({
          tenantId: parsed.tenantId,
        }),
      });
    }

    if (toolRuns.length === 0) {
      toolRuns.push({
        domain: 'fund',
        title: '资金头寸',
        result: await this.fundTool.execute({}),
      });
    }

    return this.llm.synthesizeDiagnosis(query, toolRuns);
  }

  private async parseQuery(query: string): Promise<ParsedQuery> {
    const cuidMatch = query.match(/\b(c[a-z0-9]{20,})\b/i);
    const orderId = cuidMatch?.[1];

    const slugMatch = query.match(
      /(?:分店|商户|tenant|slug)[\s:：]*([a-z0-9][a-z0-9-]*)/i,
    );
    let tenantSlug = slugMatch?.[1];
    if (!tenantSlug) {
      const bareSlug = query.match(/\b([a-z][a-z0-9-]{2,})\b/g);
      tenantSlug = bareSlug?.find(
        (s) => !['commission', 'order', 'why', 'the'].includes(s.toLowerCase()),
      );
    }

    let tenantId: string | undefined;
    if (tenantSlug) {
      const tenant = await this.prisma.tenant.findFirst({
        where: { slug: tenantSlug },
        select: { id: true },
      });
      tenantId = tenant?.id;
    }

    if (orderId && !tenantId) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { tenantId: true },
      });
      tenantId = order?.tenantId;
    }

    const wantsCommission = /佣金|commission|分润/i.test(query);
    const wantsInventory = /库存|inventory|sku|仓库/i.test(query);
    const wantsFund = /资金|fund|头寸|利润/i.test(query);
    const wantsOrder = /订单|order|履约|发货|自提/i.test(query);

    const skuMatch = query.match(/\bSKU[-_]?([A-Z0-9-]+)\b/i);
    const skuCode = skuMatch?.[1];

    const defaultCommission = wantsCommission || Boolean(orderId);
    const defaultOrder = wantsOrder || Boolean(orderId);

    return {
      orderId,
      tenantId,
      tenantSlug,
      skuCode,
      runOrder: defaultOrder,
      runCommission: defaultCommission || !wantsInventory,
      runInventory: wantsInventory || Boolean(skuCode),
      runFund: wantsFund || Boolean(tenantId),
    };
  }
}
