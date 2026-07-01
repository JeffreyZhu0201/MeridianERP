import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from '../dto/company.dto';

/**
 * CRM 企业服务 (CompaniesService)
 *
 * 负责商户的 CRM 企业（公司）管理。
 *
 * 功能：
 * 1. 企业列表查询
 * 2. 企业详情查询
 * 3. 创建企业
 * 4. 更新企业信息
 * 5. 删除企业
 */
@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.crmCompany.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const company = await this.prisma.crmCompany.findFirst({
      where: { id, tenantId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  create(tenantId: string, dto: CreateCompanyDto) {
    return this.prisma.crmCompany.create({
      data: { ...dto, tenantId },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateCompanyDto) {
    await this.findOne(tenantId, id);
    return this.prisma.crmCompany.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.crmCompany.delete({ where: { id } });
    return { deleted: true };
  }
}
