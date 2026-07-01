import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePlatformCrmLeadDto,
  UpdatePlatformCrmLeadDto,
} from './dto/lead.dto';
import { assertLeadStageTransition } from './platform-crm-stage';

/**
 * 平台 CRM 线索服务 - 管理平台级 CRM 线索
 *
 * 功能范围：
 * - 查询线索列表（支持按阶段筛选）
 * - 创建线索
 * - 更新线索信息（含阶段流转校验）
 * - 删除线索
 *
 * 线索阶段流转规则：
 * - NEW → QUALIFIED
 * - QUALIFIED → WON / LOST
 * - WON/LOST 为终态，不可再流转
 */
@Injectable()
export class PlatformCrmLeadsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 查询线索列表
   *
   * @param stage - 可选，按阶段筛选
   * @returns 线索列表（按创建时间倒序，包含联系人信息）
   */
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

  /**
   * 获取线索详情
   *
   * @param id - 线索 ID
   * @returns 线索详情
   * @throws NotFoundException - 线索不存在
   */
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

  /**
   * 创建线索
   *
   * @param dto - 线索信息
   * @returns 创建的线索
   */
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

  /**
   * 更新线索信息
   *
   * 如果更新阶段，会校验阶段流转是否合法。
   *
   * @param id - 线索 ID
   * @param dto - 更新字段
   * @returns 更新后的线索
   * @throws BadRequestException - 阶段流转不合法
   */
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

  /**
   * 删除线索
   *
   * @param id - 线索 ID
   * @returns 删除确认对象
   */
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.platformCrmLead.delete({ where: { id } });
    return { deleted: true as const };
  }
}
