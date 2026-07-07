import { Injectable, Logger } from '@nestjs/common';
import {
  BranchPurchaseOrderStatus,
  PurchaseOrderStatus,
} from '@prisma/client';
import type { ReplenishmentSuggestion } from '@meridian/shared';
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
  ) {}

  async suggest(tenantId: string): Promise<ReplenishmentSuggestion> {
    const context = await this.buildContext(tenantId);
    this.logger.log(
      `Replenishment AI tenantId=${tenantId} alerts=${context.alerts.length}`,
    );
    return this.aiLlm.suggestReplenishment(context);
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

    const totals = new Map<string, { variantId: string; sku: string; totalQty: number }>();
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

    return [...totals.values()].sort((a, b) => b.totalQty - a.totalQty).slice(0, 10);
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
            masterSku: { select: { id: true, sku: true } },
          },
        },
      },
    });

    return orders.flatMap((order) =>
      order.lines.map((line) => ({
        masterSkuId: line.masterSku.id,
        sku: line.masterSku.sku,
        qtyPending: line.quantityOrdered - line.quantityReceived,
      })),
    );
  }
}
