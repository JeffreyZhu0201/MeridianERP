import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadStageDto } from '../dto/lead.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.crmLead.findMany({
      where: { tenantId },
      include: { contact: true, distributor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const lead = await this.prisma.crmLead.findFirst({
      where: { id, tenantId },
      include: { contact: true, distributor: true },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  create(tenantId: string, dto: CreateLeadDto) {
    return this.prisma.crmLead.create({
      data: { ...dto, tenantId },
      include: { contact: true, distributor: true },
    });
  }

  async updateStage(tenantId: string, id: string, dto: UpdateLeadStageDto) {
    await this.findOne(tenantId, id);
    return this.prisma.crmLead.update({
      where: { id },
      data: { stage: dto.stage },
      include: { contact: true, distributor: true },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.crmLead.delete({ where: { id } });
    return { deleted: true };
  }
}
