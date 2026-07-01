import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateActivityDto } from '../dto/activity.dto';

/**
 * CRM 活动服务 (ActivitiesService)
 *
 * 负责商户的 CRM 活动记录管理。
 *
 * 功能：
 * 1. 活动列表查询（包含关联联系人信息）
 * 2. 活动详情查询
 * 3. 创建活动记录
 * 4. 删除活动记录
 *
 * 活动类型 (ActivityType)：CALL, MEETING, EMAIL, NOTE 等
 *
 * 活动可关联到联系人（Contact）或线索（Lead）。
 */
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
