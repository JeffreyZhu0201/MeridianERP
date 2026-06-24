import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateContactDto, UpdateContactDto } from '../dto/contact.dto';

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
