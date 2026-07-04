import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BranchPurchaseOrderStatus, Prisma } from '@prisma/client';
import { PlatformAllocationsService } from '../allocations/platform-allocations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformBranchPurchaseOrderListQueryDto } from '../../merchant/procurement/dto/procurement.dto';

@Injectable()
export class PlatformProcurementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly allocations: PlatformAllocationsService,
  ) {}

  async listOrders(query: PlatformBranchPurchaseOrderListQueryDto) {
    const where: Prisma.BranchPurchaseOrderWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.tenantId) where.tenantId = query.tenantId;

    const orders = await this.prisma.branchPurchaseOrder.findMany({
      where,
      include: {
        tenant: { include: { merchantProfile: true } },
        lines: { include: { masterSku: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      tenantId: order.tenantId,
      tenantName: order.tenant.merchantProfile?.businessName ?? order.tenant.slug,
      status: order.status,
      totalAmount: order.totalAmount,
      lineCount: order.lines.length,
      paidAt: order.paidAt?.toISOString() ?? null,
      allocationOrderId: order.allocationOrderId,
      createdAt: order.createdAt.toISOString(),
      lines: order.lines.map((line) => ({
        skuCode: line.masterSku.skuCode,
        productName: line.masterSku.name,
        quantityOrdered: line.quantityOrdered,
        unitWholesalePrice: line.unitWholesalePrice,
      })),
      receivingAddress: order.receivingAddressSnapshot as {
        label: string;
        contactName: string;
        contactPhone: string;
        address: string;
      } | null,
    }));
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
      id: order.id,
      orderNumber: order.orderNumber,
      tenantId: order.tenantId,
      tenantName: order.tenant.merchantProfile?.businessName ?? order.tenant.slug,
      status: order.status,
      totalAmount: order.totalAmount,
      paidAt: order.paidAt?.toISOString() ?? null,
      allocationOrderId: order.allocationOrderId,
      createdAt: order.createdAt.toISOString(),
      receivingAddress: order.receivingAddressSnapshot as {
        label: string;
        contactName: string;
        contactPhone: string;
        address: string;
      } | null,
      lines: order.lines.map((line) => ({
        skuCode: line.masterSku.skuCode,
        productName: line.masterSku.name,
        quantityOrdered: line.quantityOrdered,
        quantityReceived: line.quantityReceived,
        unitWholesalePrice: line.unitWholesalePrice,
      })),
    };
  }
}
