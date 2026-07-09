import { Injectable } from '@nestjs/common';
import { CommissionSource, LedgerStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { DiagnosisTool, type ToolResult } from './base.tool';

@Injectable()
export class CommissionDiagnosisTool extends DiagnosisTool {
  readonly domain = 'commission' as const;
  readonly name = 'commission_query';

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const orderId = typeof args.orderId === 'string' ? args.orderId : undefined;
    const tenantId =
      typeof args.tenantId === 'string' ? args.tenantId : undefined;
    const allocationOrderId =
      typeof args.allocationOrderId === 'string'
        ? args.allocationOrderId
        : undefined;

    if (orderId) {
      const ledger = await this.prisma.commissionLedger.findUnique({
        where: { orderId },
        include: { distributor: { select: { name: true } } },
      });
      if (ledger) {
        return {
          found: true,
          summary: `订单关联佣金 ${ledger.amount.toString()}（${ledger.status}）`,
          data: {
            id: ledger.id,
            amount: ledger.amount.toString(),
            status: ledger.status,
            commissionSource: ledger.commissionSource,
            distributorName: ledger.distributor.name,
          },
        };
      }
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });
      if (!order) {
        return this.notFound(orderId);
      }
      return {
        found: false,
        summary:
          '该订单无佣金台账；当前模型仅在分店配货单 CONFIRMED 时计提拓店员佣金，零售订单不产生佣金',
        data: {
          orderId,
          orderStatus: order.status,
          commissionModel: 'ALLOCATION_ONLY',
        },
      };
    }

    const resolvedTenantId =
      tenantId ??
      (allocationOrderId
        ? (
            await this.prisma.allocationOrder.findUnique({
              where: { id: allocationOrderId },
              select: { tenantId: true },
            })
          )?.tenantId
        : undefined);

    if (!resolvedTenantId) {
      return this.notFound('tenantId or allocationOrderId');
    }

    const [ledgers, allocationCount, profile] = await Promise.all([
      this.prisma.commissionLedger.findMany({
        where: {
          tenantId: resolvedTenantId,
          commissionSource: CommissionSource.ALLOCATION,
          status: { not: LedgerStatus.VOID },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { distributor: { select: { name: true } } },
      }),
      this.prisma.commissionLedger.count({
        where: {
          tenantId: resolvedTenantId,
          commissionSource: CommissionSource.ALLOCATION,
          status: { not: LedgerStatus.VOID },
        },
      }),
      this.prisma.merchantProfile.findUnique({
        where: { tenantId: resolvedTenantId },
        select: { recruitedByDistributorId: true },
      }),
    ]);

    if (allocationOrderId) {
      const allocLedger = await this.prisma.commissionLedger.findUnique({
        where: { allocationOrderId },
        include: { distributor: { select: { name: true } } },
      });
      if (allocLedger) {
        return {
          found: true,
          summary: `配货单已计提佣金 ${allocLedger.amount.toString()}（序号 ${allocLedger.merchantAllocationSequence}）`,
          data: {
            allocationOrderId,
            ledger: {
              amount: allocLedger.amount.toString(),
              status: allocLedger.status,
              sequence: allocLedger.merchantAllocationSequence,
              distributorName: allocLedger.distributor.name,
            },
          },
        };
      }
      const allocation = await this.prisma.allocationOrder.findUnique({
        where: { id: allocationOrderId },
      });
      if (!allocation) {
        return this.notFound(allocationOrderId);
      }
      const reasons: string[] = [];
      if (allocation.status !== 'CONFIRMED') {
        reasons.push(
          `配货单状态为 ${allocation.status}，需 CONFIRMED 后才计提`,
        );
      }
      if (!profile?.recruitedByDistributorId) {
        reasons.push('分店未绑定拓店员');
      }
      if (allocationCount >= 2) {
        reasons.push('该分店已达前两笔配货佣金上限');
      }
      return {
        found: false,
        summary: reasons.length
          ? reasons.join('；')
          : '配货单已确认但未生成佣金，请检查拓店员状态与佣金率',
        data: {
          allocationOrderId,
          allocationStatus: allocation.status,
          priorCommissionCount: allocationCount,
          hasRecruiter: Boolean(profile?.recruitedByDistributorId),
        },
      };
    }

    return {
      found: ledgers.length > 0,
      summary:
        ledgers.length > 0
          ? `分店共有 ${allocationCount} 笔配货佣金记录`
          : '分店尚无配货佣金；需拓店员招募且配货单 CONFIRMED（前 2 笔）',
      data: {
        tenantId: resolvedTenantId,
        commissionCount: allocationCount,
        hasRecruiter: Boolean(profile?.recruitedByDistributorId),
        recent: ledgers.map((l) => ({
          amount: l.amount.toString(),
          status: l.status,
          sequence: l.merchantAllocationSequence,
          distributorName: l.distributor.name,
        })),
      },
    };
  }
}
