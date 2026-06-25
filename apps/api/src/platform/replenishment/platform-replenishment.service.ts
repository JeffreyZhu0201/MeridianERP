import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReplenishmentRequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformAllocationsService } from '../allocations/platform-allocations.service';

@Injectable()
export class PlatformReplenishmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly allocationsService: PlatformAllocationsService,
  ) {}

  async list(status?: ReplenishmentRequestStatus) {
    return this.prisma.replenishmentRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        tenant: { include: { merchantProfile: true } },
        lines: { include: { masterSku: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, platformUserId: string) {
    const req = await this.prisma.replenishmentRequest.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!req) throw new NotFoundException('Replenishment request not found');
    if (req.status !== ReplenishmentRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    const allocation = await this.allocationsService.createAllocation(
      req.tenantId,
      req.lines.map((l) => ({
        masterSkuId: l.masterSkuId,
        quantity: l.quantity,
      })),
      req.note ? `From replenishment ${req.id}: ${req.note}` : `From replenishment ${req.id}`,
    );

    await this.allocationsService.issueAllocation(allocation.id, platformUserId);

    return this.prisma.replenishmentRequest.update({
      where: { id },
      data: {
        status: ReplenishmentRequestStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedByPlatformUserId: platformUserId,
      },
      include: {
        tenant: { include: { merchantProfile: true } },
        lines: { include: { masterSku: true } },
      },
    });
  }

  async reject(id: string, platformUserId: string, reason: string) {
    const req = await this.prisma.replenishmentRequest.findUnique({
      where: { id },
    });
    if (!req) throw new NotFoundException('Replenishment request not found');
    if (req.status !== ReplenishmentRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }
    return this.prisma.replenishmentRequest.update({
      where: { id },
      data: {
        status: ReplenishmentRequestStatus.REJECTED,
        rejectionReason: reason,
        reviewedAt: new Date(),
        reviewedByPlatformUserId: platformUserId,
      },
    });
  }
}
