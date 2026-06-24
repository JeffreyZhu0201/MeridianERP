import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateActivityDto } from '../dto/activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.crmActivity.findMany({
      where: { tenantId },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const activity = await this.prisma.crmActivity.findFirst({
      where: { id, tenantId },
      include: { contact: true },
    });
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    return activity;
  }

  create(tenantId: string, dto: CreateActivityDto) {
    return this.prisma.crmActivity.create({
      data: { ...dto, tenantId },
      include: { contact: true },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.crmActivity.delete({ where: { id } });
    return { deleted: true };
  }
}
