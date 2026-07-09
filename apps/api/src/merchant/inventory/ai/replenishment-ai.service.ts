import { Injectable, Logger } from '@nestjs/common';
import { BranchPurchaseOrderStatus, PurchaseOrderStatus } from '@prisma/client';
import type {
  AiStreamEvent,
  PaginatedReplenishmentAnalysisHistory,
  ProcurementPrefillResponse,
  ReplenishmentAnalysisResponse,
} from '@meridian/shared';
import { AiAnalysisRecordService } from '../../../ai/logging/ai-analysis-record.service';
import { AiLlmStreamService } from '../../../ai/llm/ai-llm-stream.service';
import { AiLlmService } from '../../../ai/llm/ai-llm.service';
import type { ReplenishmentContext } from '../../../ai/llm/merchant-ai.types';
import { PrismaService } from '../../../prisma/prisma.service';
import { MerchantStockService } from '../merchant-stock.service';

const MAX_ALERTS = 20;
const OUTBOUND_DAYS = 30;

@Injectable()
export class ReplenishmentAiService {
  private readonly logger = new Logger(ReplenishmentAiService.name);

  constructor(
    private readonly stock: MerchantStockService,
    private readonly prisma: PrismaService,
    private readonly aiLlm: AiLlmService,
    private readonly aiLlmStream: AiLlmStreamService,
    private readonly analysisRecords: AiAnalysisRecordService,
  ) {}

  async suggest(
    tenantId: string,
    userId?: string,
  ): Promise<ReplenishmentAnalysisResponse> {
    const context = await this.buildContext(tenantId);
    this.logger.log(
      `Replenishment AI tenantId=${tenantId} alerts=${context.alerts.length}`,
    );

    const { result, callLogId } = await this.aiLlm.suggestReplenishment(
      context,
      {
        tenantId,
        actorUserId: userId,
        actorType: 'MERCHANT',
      },
    );

    return this.analysisRecords.saveReplenishment(
      tenantId,
      userId,
      result,
      callLogId,
    );
  }

  getLatest(tenantId: string): Promise<ReplenishmentAnalysisResponse | null> {
    return this.analysisRecords.getLatestReplenishment(tenantId);
  }

  listHistory(
    tenantId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedReplenishmentAnalysisHistory> {
    return this.analysisRecords.listReplenishmentHistory(tenantId, page, limit);
  }

  async *streamSuggest(
    tenantId: string,
    userId?: string,
  ): AsyncGenerator<AiStreamEvent> {
    const context = await this.buildContext(tenantId);
    this.logger.log(
      `Replenishment AI stream tenantId=${tenantId} alerts=${context.alerts.length}`,
    );

    let finalResult: ReplenishmentAnalysisResponse | null = null;
    let callLogId: string | null = null;

    for await (const event of this.aiLlmStream.streamReplenishment(
      context,
      tenantId,
      userId,
    )) {
      if (event.type === 'done') {
        callLogId = event.callLogId ?? null;
        finalResult = await this.analysisRecords.saveReplenishment(
          tenantId,
          userId,
          event.result as Parameters<
            AiAnalysisRecordService['saveReplenishment']
          >[2],
          callLogId,
        );
        yield {
          type: 'done',
          result: finalResult,
          callLogId: callLogId ?? undefined,
          analysisId: finalResult.analysisId,
        };
        continue;
      }
      yield event;
    }
  }

  async getProcurementPrefill(
    tenantId: string,
  ): Promise<ProcurementPrefillResponse | null> {
    const latest = await this.analysisRecords.getLatestReplenishment(tenantId);
    if (!latest || latest.priorities.length === 0) {
      return null;
    }

    const variantIds = latest.priorities.map((p) => p.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds }, product: { tenantId } },
      select: {
        id: true,
        masterSkuId: true,
        sku: true,
        product: { select: { name: true } },
      },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const masterSkuIds = [
      ...new Set(
        variants
          .map((v) => v.masterSkuId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const masterSkus = await this.prisma.masterSku.findMany({
      where: { id: { in: masterSkuIds }, isActive: true },
      select: { id: true, skuCode: true, name: true },
    });
    const masterSkuMap = new Map(masterSkus.map((m) => [m.id, m]));

    const lines: ProcurementPrefillResponse['lines'] = [];
    const skipped: ProcurementPrefillResponse['skipped'] = [];

    for (const priority of latest.priorities) {
      if (priority.suggestedQty <= 0) {
        skipped.push({
          variantId: priority.variantId,
          reason: 'ZERO_QUANTITY',
        });
        continue;
      }

      const variant = variantMap.get(priority.variantId);
      if (!variant?.masterSkuId) {
        skipped.push({
          variantId: priority.variantId,
          reason: 'NO_MASTER_SKU',
        });
        continue;
      }

      const masterSku = masterSkuMap.get(variant.masterSkuId);
      if (!masterSku) {
        skipped.push({
          variantId: priority.variantId,
          reason: 'MASTER_SKU_INACTIVE',
        });
        continue;
      }

      lines.push({
        masterSkuId: masterSku.id,
        quantity: priority.suggestedQty,
        sku: masterSku.skuCode,
        name: masterSku.name,
      });
    }

    if (lines.length === 0) {
      return null;
    }

    return {
      analysisId: latest.analysisId,
      createdAt: latest.createdAt,
      lines,
      skipped,
    };
  }

  private async buildContext(tenantId: string): Promise<ReplenishmentContext> {
    const [profile, settings, alertsRes, recentOutbound, pendingProcurement] =
      await Promise.all([
        this.prisma.merchantProfile.findFirst({ where: { tenantId } }),
        this.prisma.tenantInventorySettings.findUnique({ where: { tenantId } }),
        this.stock.lowStockAlerts(tenantId),
        this.loadRecentOutbound(tenantId),
        this.loadPendingProcurement(tenantId),
      ]);

    const isFlagship = profile?.isFlagship ?? false;
    const alerts = [...alertsRes.items]
      .sort((a, b) => a.quantityOnHand - b.quantityOnHand)
      .slice(0, MAX_ALERTS);

    return {
      tenantId,
      isFlagship,
      businessName: profile?.businessName ?? undefined,
      defaultReorderThreshold: settings?.defaultReorderThreshold ?? 5,
      alerts,
      recentOutbound,
      pendingProcurement,
    };
  }

  private async loadRecentOutbound(tenantId: string) {
    const since = new Date();
    since.setDate(since.getDate() - OUTBOUND_DAYS);

    const rows = await this.prisma.stockAdjustment.findMany({
      where: {
        tenantId,
        createdAt: { gte: since },
        quantityDelta: { lt: 0 },
      },
      include: {
        variant: { select: { id: true, sku: true } },
      },
    });

    const totals = new Map<
      string,
      { variantId: string; sku: string; totalQty: number }
    >();
    for (const row of rows) {
      const key = row.variantId;
      const existing = totals.get(key);
      const qty = Math.abs(row.quantityDelta);
      if (existing) {
        existing.totalQty += qty;
      } else {
        totals.set(key, {
          variantId: row.variant.id,
          sku: row.variant.sku,
          totalQty: qty,
        });
      }
    }

    return [...totals.values()]
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 10);
  }

  private async loadPendingProcurement(tenantId: string) {
    const profile = await this.prisma.merchantProfile.findFirst({
      where: { tenantId },
    });
    const isFlagship = profile?.isFlagship ?? false;

    if (isFlagship) {
      const orders = await this.prisma.purchaseOrder.findMany({
        where: {
          tenantId,
          status: {
            in: [
              PurchaseOrderStatus.DRAFT,
              PurchaseOrderStatus.ORDERED,
              PurchaseOrderStatus.PARTIALLY_RECEIVED,
            ],
          },
        },
        include: {
          lines: {
            include: {
              variant: { select: { id: true, sku: true } },
            },
          },
        },
      });

      return orders.flatMap((order) =>
        order.lines.map((line) => ({
          variantId: line.variant.id,
          sku: line.variant.sku,
          qtyPending: line.quantityOrdered - line.quantityReceived,
        })),
      );
    }

    const orders = await this.prisma.branchPurchaseOrder.findMany({
      where: {
        tenantId,
        status: {
          in: [
            BranchPurchaseOrderStatus.PAID,
            BranchPurchaseOrderStatus.PROCESSING,
            BranchPurchaseOrderStatus.SHIPPED,
          ],
        },
      },
      include: {
        lines: {
          include: {
            masterSku: { select: { id: true, skuCode: true } },
          },
        },
      },
    });

    return orders.flatMap((order) =>
      order.lines.map((line) => ({
        masterSkuId: line.masterSku.id,
        sku: line.masterSku.skuCode,
        qtyPending: line.quantityOrdered - line.quantityReceived,
      })),
    );
  }
}
