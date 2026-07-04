import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BranchPurchaseOrderPaymentStatus,
  BranchPurchaseOrderStatus,
  Prisma,
} from '@prisma/client';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { getPagination } from '../../common/pagination';
import { InventoryService } from '../../inventory/inventory.service';
import { PaymentService } from '../../payment/payment.service';
import { PlatformAllocationsService } from '../../platform/allocations/platform-allocations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MerchantWarehousesService } from '../inventory/merchant-warehouses.service';
import { MerchantProcurementAddressesService } from '../settings/merchant-procurement-addresses.service';
import {
  BranchPurchaseOrderListQueryDto,
  CreateBranchPurchaseOrderDto,
} from './dto/procurement.dto';

@Injectable()
export class MerchantProcurementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly warehouses: MerchantWarehousesService,
    private readonly allocations: PlatformAllocationsService,
    private readonly payment: PaymentService,
    private readonly addresses: MerchantProcurementAddressesService,
  ) {}

  async listCatalog() {
    const skus = await this.prisma.masterSku.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return skus.map((sku) => ({
      id: sku.id,
      skuCode: sku.skuCode,
      name: sku.name,
      quantityOnHand: sku.quantityOnHand,
      wholesalePrice: sku.wholesalePrice,
      retailPrice: sku.retailPrice,
      isActive: sku.isActive,
    }));
  }

  async listOrders(tenantId: string, query: BranchPurchaseOrderListQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.BranchPurchaseOrderWhereInput = { tenantId };
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.branchPurchaseOrder.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { lines: true },
      }),
      this.prisma.branchPurchaseOrder.count({ where }),
    ]);

    return {
      data: items.map((order) => this.mapSummary(order)),
      meta: { total, page, limit },
    };
  }

  async getOrder(tenantId: string, id: string) {
    const order = await this.prisma.branchPurchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        lines: { include: { masterSku: true } },
        payment: true,
      },
    });
    if (!order) throw new NotFoundException('Procurement order not found');
    return this.mapDetail(order);
  }

  async createOrder(user: AuthenticatedUser, dto: CreateBranchPurchaseOrderDto) {
    const tenantId = user.tenantId!;
    await this.inventory.migrateTenantInventory(tenantId);
    const warehouseId = await this.warehouses.resolveDefaultWarehouseId(tenantId);
    const lines = await this.validateLines(dto.lines);
    const totalAmount = lines.reduce(
      (sum, line) => sum.add(line.lineTotal),
      new Prisma.Decimal(0),
    );
    const orderNumber = await this.nextOrderNumber(tenantId);
    const receivingAddress = await this.addresses.resolveForOrder(
      tenantId,
      dto.receivingAddressId,
    );
    const receivingAddressSnapshot = this.addresses.snapshotFromAddress(
      receivingAddress,
    );

    const order = await this.prisma.branchPurchaseOrder.create({
      data: {
        tenantId,
        warehouseId,
        orderNumber,
        status: BranchPurchaseOrderStatus.PENDING_PAYMENT,
        totalAmount,
        note: dto.note?.trim() || null,
        receivingAddressId: receivingAddress.id,
        receivingAddressSnapshot,
        createdById: user.userId,
        lines: {
          create: lines.map((line) => ({
            masterSkuId: line.masterSkuId,
            quantityOrdered: line.quantity,
            unitWholesalePrice: line.unitWholesalePrice,
          })),
        },
      },
      include: {
        lines: { include: { masterSku: true } },
        payment: true,
      },
    });

    return this.mapDetail(order);
  }

  async payOrder(user: AuthenticatedUser, id: string) {
    const tenantId = user.tenantId!;
    const order = await this.prisma.branchPurchaseOrder.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!order) throw new NotFoundException('Procurement order not found');
    if (order.status !== BranchPurchaseOrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order is not awaiting payment');
    }

    if (!this.payment.isMockMode()) {
      throw new BadRequestException(
        'Simulated payment is only available in mock payment mode',
      );
    }

    const allocation = await this.allocations.createAllocation(
      tenantId,
      order.lines.map((line) => ({
        masterSkuId: line.masterSkuId,
        quantity: line.quantityOrdered,
      })),
      `Branch procurement ${order.orderNumber}`,
    );

    const paidAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.branchPurchaseOrderPayment.create({
        data: {
          branchPurchaseOrderId: order.id,
          amount: order.totalAmount,
          status: BranchPurchaseOrderPaymentStatus.SUCCEEDED,
          provider: 'mock',
          paidAt,
        },
      });
      await tx.branchPurchaseOrder.update({
        where: { id: order.id },
        data: {
          status: BranchPurchaseOrderStatus.PROCESSING,
          paidAt,
          allocationOrderId: allocation.id,
        },
      });
    });

    return this.getOrder(tenantId, id);
  }

  async confirmReceipt(user: AuthenticatedUser, id: string) {
    const tenantId = user.tenantId!;
    const order = await this.prisma.branchPurchaseOrder.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!order) throw new NotFoundException('Procurement order not found');
    if (order.status !== BranchPurchaseOrderStatus.SHIPPED) {
      throw new BadRequestException('Order is not ready for receipt confirmation');
    }
    if (!order.allocationOrderId) {
      throw new BadRequestException('Allocation not linked');
    }

    await this.allocations.confirmAllocation(
      order.allocationOrderId,
      user.userId,
      tenantId,
    );

    await this.prisma.$transaction(async (tx) => {
      for (const line of order.lines) {
        await tx.branchPurchaseOrderLine.update({
          where: { id: line.id },
          data: { quantityReceived: line.quantityOrdered },
        });
      }
      await tx.branchPurchaseOrder.update({
        where: { id: order.id },
        data: { status: BranchPurchaseOrderStatus.RECEIVED },
      });
    });

    return this.getOrder(tenantId, id);
  }

  private async validateLines(
    lines: Array<{ masterSkuId: string; quantity: number }>,
  ) {
    if (lines.length === 0) {
      throw new BadRequestException('At least one line is required');
    }
    const skuIds = lines.map((l) => l.masterSkuId);
    if (new Set(skuIds).size !== skuIds.length) {
      throw new BadRequestException('Duplicate master SKU in order lines');
    }

    const masterSkus = await this.prisma.masterSku.findMany({
      where: { id: { in: skuIds } },
    });
    const skuMap = new Map(masterSkus.map((s) => [s.id, s]));

    return lines.map((line) => {
      const sku = skuMap.get(line.masterSkuId);
      if (!sku) throw new NotFoundException('Master SKU not found');
      if (!sku.isActive) {
        throw new BadRequestException(`Master SKU ${sku.skuCode} is inactive`);
      }
      if (line.quantity < 1) {
        throw new BadRequestException('Quantity must be at least 1');
      }
      const unitWholesalePrice = sku.wholesalePrice;
      const lineTotal = unitWholesalePrice.mul(line.quantity);
      return {
        masterSkuId: line.masterSkuId,
        quantity: line.quantity,
        unitWholesalePrice,
        lineTotal,
      };
    });
  }

  private async nextOrderNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.branchPurchaseOrder.count({
      where: { tenantId },
    });
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `BP-${date}-${String(count + 1).padStart(4, '0')}`;
  }

  private mapSummary(
    order: Prisma.BranchPurchaseOrderGetPayload<{ include: { lines: true } }>,
  ) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      lineCount: order.lines.length,
      paidAt: order.paidAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
    };
  }

  private mapDetail(
    order: Prisma.BranchPurchaseOrderGetPayload<{
      include: { lines: { include: { masterSku: true } }; payment: true };
    }>,
  ) {
    return {
      ...this.mapSummary(order),
      note: order.note,
      allocationOrderId: order.allocationOrderId,
      receivingAddress: order.receivingAddressSnapshot as {
        label: string;
        contactName: string;
        contactPhone: string;
        address: string;
      } | null,
      mockPayment: this.payment.isMockMode(),
      lines: order.lines.map((line) => ({
        id: line.id,
        masterSkuId: line.masterSkuId,
        skuCode: line.masterSku.skuCode,
        productName: line.masterSku.name,
        quantityOrdered: line.quantityOrdered,
        quantityReceived: line.quantityReceived,
        unitWholesalePrice: line.unitWholesalePrice,
        lineTotal: line.unitWholesalePrice.mul(line.quantityOrdered),
      })),
      payment: order.payment
        ? {
            status: order.payment.status,
            paidAt: order.payment.paidAt?.toISOString() ?? null,
            provider: order.payment.provider,
          }
        : null,
    };
  }
}
