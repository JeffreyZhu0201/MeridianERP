import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateContactDto, UpdateContactDto } from '../dto/contact.dto';

/**
 * CRM 联系人服务 (ContactsService)
 *
 * 负责商户的 CRM 联系人管理。
 *
 * 功能：
 * 1. 联系人列表查询（包含关联企业信息）
 * 2. 联系人详情查询
 * 3. 创建联系人
 * 4. 更新联系人信息
 * 5. 删除联系人
 *
 * 联系人可以关联到企业（Company），也可独立存在。
 */
@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.crmContact.findMany({
      where: { tenantId },
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const contact = await this.prisma.crmContact.findFirst({
      where: { id, tenantId },
      include: { company: true },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    return contact;
  }

  create(tenantId: string, dto: CreateContactDto) {
    return this.prisma.crmContact.create({
      data: { ...dto, tenantId },
      include: { company: true },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateContactDto) {
    await this.findOne(tenantId, id);
    return this.prisma.crmContact.update({
      where: { id },
      data: dto,
      include: { company: true },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.crmContact.delete({ where: { id } });
    return { deleted: true };
  }
}
