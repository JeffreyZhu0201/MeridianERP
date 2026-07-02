import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePlatformCrmContactDto,
  UpdatePlatformCrmContactDto,
} from './dto/contact.dto';

@Injectable()
export class PlatformCrmContactsService {
  constructor(private readonly prisma: PrismaService) {}

  
  findAll() {
    return this.prisma.platformCrmContact.findMany({
      orderBy: { createdAt: 'desc' },
      include: { company: { select: { id: true, name: true } } },
    });
  }

  
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

  
  create(dto: CreatePlatformCrmContactDto) {
    return this.prisma.platformCrmContact.create({
      data: dto,
      include: { company: { select: { id: true, name: true } } },
    });
  }

  
  async update(id: string, dto: UpdatePlatformCrmContactDto) {
    await this.findOne(id);
    return this.prisma.platformCrmContact.update({
      where: { id },
      data: dto,
      include: { company: { select: { id: true, name: true } } },
    });
  }

  
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
