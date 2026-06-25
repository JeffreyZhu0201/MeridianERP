import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePlatformCrmCompanyDto,
  UpdatePlatformCrmCompanyDto,
} from './dto/company.dto';

@Injectable()
export class PlatformCrmCompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.platformCrmCompany.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { contacts: true } } },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.platformCrmCompany.findUnique({
      where: { id },
      include: { _count: { select: { contacts: true } } },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  create(dto: CreatePlatformCrmCompanyDto) {
    return this.prisma.platformCrmCompany.create({
      data: dto,
      include: { _count: { select: { contacts: true } } },
    });
  }

  async update(id: string, dto: UpdatePlatformCrmCompanyDto) {
    await this.findOne(id);
    return this.prisma.platformCrmCompany.update({
      where: { id },
      data: dto,
      include: { _count: { select: { contacts: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.platformCrmContact.updateMany({
      where: { companyId: id },
      data: { companyId: null },
    });
    await this.prisma.platformCrmCompany.delete({ where: { id } });
    return { deleted: true as const };
  }
}
