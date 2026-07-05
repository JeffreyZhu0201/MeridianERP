import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BranchPurchaseOrderStatus, Prisma } from '@prisma/client';
import type { PlatformProcurementOrderSummary } from '@meridian/shared';
import { PlatformAllocationsService } from '../allocations/platform-allocations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformBranchPurchaseOrderListQueryDto } from '../../merchant/procurement/dto/procurement.dto';

type OrderWithRelations = Prisma.BranchPurchaseOrderGetPayload<{
  include: {
    tenant: { include: { merchantProfile: true } };
    lines: { include: { masterSku: true } };
  };
}>;

@Injectable()
export class PlatformProcurementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly allocations: PlatformAllocationsService,
  ) {}

  async listOrders(
    query: PlatformBranchPurchaseOrderListQueryDto,
  ): Promise<PlatformProcurementOrderSummary[]> {
    const where = this.buildListWhere(query);
    const orders = await this.prisma.branchPurchaseOrder.findMany({
      where,
      include: {
        tenant: { include: { merchantProfile: true } },
        lines: { include: { masterSku: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => this.mapOrder(order));
  }

  async shipOrder(platformUserId: string, id: string) {
    const order = await this.prisma.branchPurchaseOrder.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!order) throw new NotFoundException('Procurement order not found');
    if (
      order.status !== BranchPurchaseOrderStatus.PROCESSING &&
      order.status !== BranchPurchaseOrderStatus.PAID
    ) {
      throw new BadRequestException('Order is not awaiting shipment');
    }
    if (!order.allocationOrderId) {
      throw new BadRequestException('Allocation not linked');
    }

    await this.allocations.issueAllocation(order.allocationOrderId, platformUserId);

    await this.prisma.branchPurchaseOrder.update({
      where: { id },
      data: { status: BranchPurchaseOrderStatus.SHIPPED },
    });

    return this.getOrder(id);
  }

  async getOrder(id: string) {
    const order = await this.prisma.branchPurchaseOrder.findUnique({
      where: { id },
      include: {
        tenant: { include: { merchantProfile: true } },
        lines: { include: { masterSku: true } },
      },
    });
    if (!order) throw new NotFoundException('Procurement order not found');
    return {
      ...this.mapOrder(order),
      lines: order.lines.map((line) => ({
        skuCode: line.masterSku.skuCode,
        productName: line.masterSku.name,
        quantityOrdered: line.quantityOrdered,
        quantityReceived: line.quantityReceived,
        unitWholesalePrice: line.unitWholesalePrice,
      })),
    };
  }

  private buildListWhere(
    query: PlatformBranchPurchaseOrderListQueryDto,
  ): Prisma.BranchPurchaseOrderWhereInput {
    const where: Prisma.BranchPurchaseOrderWhereInput = {};
    if (query.status === 'ALL' || !query.status) {
      where.status = { not: BranchPurchaseOrderStatus.PENDING_PAYMENT };
    } else {
      where.status = query.status as BranchPurchaseOrderStatus;
    }
    if (query.tenantId) where.tenantId = query.tenantId;
    return where;
  }

  private mapOrder(order: OrderWithRelations): PlatformProcurementOrderSummary {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      tenantId: order.tenantId,
      tenantName: order.tenant.merchantProfile?.businessName ?? order.tenant.slug,
      status: order.status,
      totalAmount: order.totalAmount.toString(),
      lineCount: order.lines.length,
      paidAt: order.paidAt?.toISOString() ?? null,
      allocationOrderId: order.allocationOrderId,
      createdAt: order.createdAt.toISOString(),
      lines: order.lines.map((line) => ({
        skuCode: line.masterSku.skuCode,
        productName: line.masterSku.name,
        quantityOrdered: line.quantityOrdered,
        unitWholesalePrice: line.unitWholesalePrice.toString(),
      })),
      receivingAddress: order.receivingAddressSnapshot as PlatformProcurementOrderSummary['receivingAddress'],
    };
  }
}
