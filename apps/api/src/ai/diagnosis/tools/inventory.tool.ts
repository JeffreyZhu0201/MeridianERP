import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DiagnosisTool, type ToolResult } from './base.tool';

@Injectable()
export class InventoryDiagnosisTool extends DiagnosisTool {
  readonly domain = 'inventory' as const;
  readonly name = 'inventory_query';

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const tenantId =
      typeof args.tenantId === 'string' ? args.tenantId : undefined;
    const skuCode = typeof args.skuCode === 'string' ? args.skuCode : undefined;

    if (skuCode) {
      const master = await this.prisma.masterSku.findFirst({
        where: {
          OR: [{ skuCode }, { id: skuCode }],
        },
      });
      if (!master) {
        return this.notFound(skuCode);
      }
      return {
        found: true,
        summary: `主 SKU ${master.skuCode} 在库 ${master.quantityOnHand}`,
        data: {
          skuCode: master.skuCode,
          name: master.name,
          quantityOnHand: master.quantityOnHand,
          wholesalePrice: master.wholesalePrice.toString(),
        },
      };
    }

    if (!tenantId) {
      return this.notFound('tenantId or skuCode');
    }

    const [stockLevels, warehouseCount] = await Promise.all([
      this.prisma.stockLevel.findMany({
        where: { warehouse: { tenantId } },
        include: {
          variant: { select: { sku: true, name: true } },
          warehouse: { select: { name: true } },
        },
        take: 10,
      }),
      this.prisma.warehouse.count({ where: { tenantId } }),
    ]);

    const totalQty = stockLevels.reduce(
      (sum, row) => sum + row.quantityOnHand,
      0,
    );

    return {
      found: stockLevels.length > 0 || warehouseCount > 0,
      summary:
        stockLevels.length > 0
          ? `分店 ${warehouseCount} 个仓库，抽样库存合计 ${totalQty}`
          : `分店有 ${warehouseCount} 个仓库，暂无库存记录`,
      data: {
        tenantId,
        warehouseCount,
        sampleTotalQty: totalQty,
        levels: stockLevels.map((row) => ({
          warehouse: row.warehouse.name,
          sku: row.variant?.sku ?? null,
          quantityOnHand: row.quantityOnHand,
        })),
      },
    };
  }
}
