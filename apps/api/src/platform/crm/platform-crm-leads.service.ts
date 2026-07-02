import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePlatformCrmLeadDto,
  UpdatePlatformCrmLeadDto,
} from './dto/lead.dto';
import { assertLeadStageTransition } from './platform-crm-stage';

@Injectable()
export class PlatformCrmLeadsService {
  constructor(private readonly prisma: PrismaService) {}

  
  findAll(stage?: LeadStage) {
    return this.prisma.platformCrmLead.findMany({
      where: stage ? { stage } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  
  async findOne(id: string) {
    const lead = await this.prisma.platformCrmLead.findUnique({
      where: { id },
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  
  create(dto: CreatePlatformCrmLeadDto) {
    return this.prisma.platformCrmLead.create({
      data: dto,
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  
  async update(id: string, dto: UpdatePlatformCrmLeadDto) {
    const existing = await this.findOne(id);
    if (dto.stage !== undefined) {
      assertLeadStageTransition(existing.stage, dto.stage);
    }
    return this.prisma.platformCrmLead.update({
      where: { id },
      data: dto,
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.platformCrmLead.delete({ where: { id } });
    return { deleted: true as const };
  }
}
