import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePlatformCrmCompanyDto,
  UpdatePlatformCrmCompanyDto,
} from './dto/company.dto';

/**
 * 平台 CRM 公司服务 - 管理平台级 CRM 公司
 *
 * 功能范围：
 * - 查询公司列表
 * - 创建公司
 * - 更新公司信息
 * - 删除公司（级联解除联系人关联）
 */
@Injectable()
export class PlatformCrmCompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 查询所有公司
   *
   * @returns 公司列表（按创建时间倒序，包含联系人数量）
   */
  findAll() {
    return this.prisma.platformCrmCompany.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { contacts: true } } },
    });
  }

  /**
   * 获取公司详情
   *
   * @param id - 公司 ID
   * @returns 公司详情
   * @throws NotFoundException - 公司不存在
   */
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

  /**
   * 创建公司
   *
   * @param dto - 公司信息
   * @returns 创建的公司
   */
  create(dto: CreatePlatformCrmCompanyDto) {
    return this.prisma.platformCrmCompany.create({
      data: dto,
      include: { _count: { select: { contacts: true } } },
    });
  }

  /**
   * 更新公司信息
   *
   * @param id - 公司 ID
   * @param dto - 更新字段
   * @returns 更新后的公司
   */
  async update(id: string, dto: UpdatePlatformCrmCompanyDto) {
    await this.findOne(id);
    return this.prisma.platformCrmCompany.update({
      where: { id },
      data: dto,
      include: { _count: { select: { contacts: true } } },
    });
  }

  /**
   * 删除公司
   *
   * 删除前先解除所有关联联系人的 companyId，
   * 以避免外键约束错误。
   *
   * @param id - 公司 ID
   * @returns 删除确认对象
   */
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
