import { Injectable } from '@nestjs/common';
import type { ReplenishmentSuggestion } from '@meridian/shared';
import type { ReplenishmentContext } from './merchant-ai.types';

const URGENCY_ORDER = { critical: 0, high: 1, medium: 2 } as const;

@Injectable()
export class ReplenishmentMockClient {
  suggest(context: ReplenishmentContext): ReplenishmentSuggestion {
    const alerts = [...context.alerts].sort(
      (a, b) => a.quantityOnHand - b.quantityOnHand,
    );

    if (alerts.length === 0) {
      return {
        summary: '当前没有 SKU 处于低库存或缺货状态。',
        priorities: [],
        recommendations: [
          context.isFlagship
            ? '可定期检查补货阈值设置，确保热销 SKU 及时预警。'
            : '可前往总部进货页关注补货节奏。',
        ],
        sources: [{ type: 'low_stock_alerts', ref: '0 items' }],
      };
    }

    const priorities = alerts.map((item) => {
      const { urgency, suggestedQty, rationale } = this.computePriority(item);
      return {
        variantId: item.variantId,
        sku: item.sku,
        urgency,
        suggestedQty,
        rationale,
      };
    });

    priorities.sort(
      (a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency],
    );

    const outOfStock = alerts.filter((a) => a.quantityOnHand === 0).length;
    const summary =
      outOfStock > 0
        ? `共有 ${alerts.length} 个 SKU 低于补货阈值，其中 ${outOfStock} 个已缺货，建议优先处理。`
        : `共有 ${alerts.length} 个 SKU 低于补货阈值，建议按优先级安排补货。`;

    const recommendations = context.isFlagship
      ? [
          '优先处理缺货 SKU，避免影响销售。',
          '缺货 SKU 可考虑创建采购单或录入库存调整。',
          '检查近期出库较多的 SKU 是否需提高补货阈值。',
        ]
      : [
          '优先处理缺货 SKU，前往总部进货页补货。',
          '可合并同一商品的补货需求，减少进货次数。',
          '关注在途进货单，避免重复下单。',
        ];

    return {
      summary,
      priorities,
      recommendations,
      sources: [
        {
          type: 'low_stock_alerts',
          ref: `${alerts.length} items`,
        },
      ],
    };
  }

  private computePriority(item: {
    quantityOnHand: number;
    reorderThreshold: number;
    productName: string;
    sku: string;
  }) {
    const threshold = item.reorderThreshold;
    const onHand = item.quantityOnHand;

    if (onHand === 0) {
      return {
        urgency: 'critical' as const,
        suggestedQty: threshold * 2,
        rationale: `「${item.productName}」（${item.sku}）已缺货，建议补至约 2 倍阈值（${threshold * 2}）。`,
      };
    }

    if (onHand <= threshold / 2) {
      return {
        urgency: 'high' as const,
        suggestedQty: Math.max(1, threshold * 2 - onHand),
        rationale: `库存 ${onHand} 已低于阈值 ${threshold} 的一半，建议补货 ${Math.max(1, threshold * 2 - onHand)} 件。`,
      };
    }

    return {
      urgency: 'medium' as const,
      suggestedQty: Math.max(1, threshold - onHand + threshold),
      rationale: `库存 ${onHand} 略低于阈值 ${threshold}，建议补货 ${Math.max(1, threshold - onHand + threshold)} 件。`,
    };
  }
}
