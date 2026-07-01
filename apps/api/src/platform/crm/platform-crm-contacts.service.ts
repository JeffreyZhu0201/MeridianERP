import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePlatformCrmContactDto,
  UpdatePlatformCrmContactDto,
} from './dto/contact.dto';

/**
 * 平台 CRM 联系人服务 - 管理平台级 CRM 联系人
 *
 * 功能范围：
 * - 查询联系人列表
 * - 创建联系人
 * - 更新联系人信息
 * - 删除联系人（级联解除线索关联）
 */
@Injectable()
export class PlatformCrmContactsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 查询所有联系人
   *
   * @returns 联系人列表（按创建时间倒序，包含所属公司信息）
   */
  findAll() {
    return this.prisma.platformCrmContact.findMany({
      orderBy: { createdAt: 'desc' },
      include: { company: { select: { id: true, name: true } } },
    });
  }

  /**
   * 获取联系人详情
   *
   * @param id - 联系人 ID
   * @returns 联系人详情
   * @throws NotFoundException - 联系人不存在
   */
  async findOne(id: string) {
    const contact = await this.prisma.platformCrmContact.findUnique({
      where: { id },
      include: { company: { select: { id: true, name: true } } },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    return contact;
  }

  /**
   * 创建联系人
   *
   * @param dto - 联系人信息
   * @returns 创建的联系人
   */
  create(dto: CreatePlatformCrmContactDto) {
    return this.prisma.platformCrmContact.create({
      data: dto,
      include: { company: { select: { id: true, name: true } } },
    });
  }

  /**
   * 更新联系人信息
   *
   * @param id - 联系人 ID
   * @param dto - 更新字段
   * @returns 更新后的联系人
   */
  async update(id: string, dto: UpdatePlatformCrmContactDto) {
    await this.findOne(id);
    return this.prisma.platformCrmContact.update({
      where: { id },
      data: dto,
      include: { company: { select: { id: true, name: true } } },
    });
  }

  /**
   * 删除联系人
   *
   * 删除前先解除所有关联线索的 contactId，
   * 以避免外键约束错误。
   *
   * @param id - 联系人 ID
   * @returns 删除确认对象
   */
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.platformCrmLead.updateMany({
      where: { contactId: id },
      data: { contactId: null },
    });
    await this.prisma.platformCrmContact.delete({ where: { id } });
    return { deleted: true as const };
  }
}
