/*
 * @Author: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @Date: 2026-06-30 20:26:16
 * @LastEditors: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @LastEditTime: 2026-07-01 15:34:38
 * @FilePath: /MeridianERP/apps/api/src/platform/distributors/platform-distributors.service.ts
 * @Description: Platform distributors service
 * 
 * Platform distributors service
 * - 查询平台级经销商列表
 * - 创建平台级经销商
 * - 更新平台级经销商信息
 * - 开通平台级经销商门户
 * - 获取平台级经销商详情
 * - 为平台级经销商创建商户招募邀请码
 * - 作废平台级经销商邀请码
 * - 获取平台级经销商招募的分店列表
 * 
 * Copyright (c) 2026 by JeffreyZhu, All Rights Reserved. 
 */


import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommissionType, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EnvService } from '../../config/env.service';

/**
 * 生成随机邀请码
 *
 * 用于商户招募邀请码生成。
 * 6位大写字母组成。
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

/**
 * 平台经销商服务 - 管理平台级经销商（渠道合作伙伴）
 *
 * 功能范围：
 * - 经销商列表查询
 * - 创建/更新经销商信息
 * - 开通经销商门户
 * - 管理商户招募邀请码
 * - 查询经销商招募的分店业绩
 *
 * 平台级经销商特点：
 * - tenantId 为 null（不属于任何商户租户）
 * - 可招募商户分店
 * - 佣金从平台直接结算
 */
@Injectable()
export class PlatformDistributorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
  ) {}

  /**
   * 查询平台级经销商列表
   *
   * @returns 经销商列表（包含招募的分店数量）
   */
  async list() {
    const rows = await this.prisma.distributor.findMany({
      where: { tenantId: null },
      include: { _count: { select: { recruitedMerchants: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      commissionRate: Number(d.commissionRate),
      commissionType: d.commissionType,
      isActive: d.isActive,
      portalEnabled: d.portalEnabled,
      recruitedMerchantCount: d._count.recruitedMerchants,
      createdAt: d.createdAt.toISOString(),
    }));
  }

  /**
   * 创建平台级经销商
   *
   * @param dto - 创建参数
   * @param dto.name - 经销商名称
   * @param dto.email - 邮箱（可选，用于登录）
   * @param dto.phone - 电话（可选）
   * @param dto.commissionRate - 佣金比例/金额
   * @param dto.commissionType - 佣金类型（PERCENT 或 FIXED）
   * @returns 创建的经销商
   */
  async create(dto: {
    name: string;
    email?: string;
    phone?: string;
    commissionRate: number;
    commissionType?: CommissionType;
  }) {
    return this.prisma.distributor.create({
      data: {
        tenantId: null,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        commissionRate: dto.commissionRate,
        commissionType: dto.commissionType ?? CommissionType.PERCENT,
        isActive: true,
      },
    });
  }

  /**
   * 更新经销商信息
   *
   * @param id - 经销商 ID
   * @param dto - 更新参数（可选字段）
   * @returns 更新后的经销商
   * @throws NotFoundException - 经销商不存在或非平台级
   */
  async update(
    id: string,
    dto: Partial<{
      name: string;
      email: string;
      phone: string;
      commissionRate: number;
      commissionType: CommissionType;
      isActive: boolean;
    }>,
  ) {
    await this.assertPlatformDistributor(id);
    return this.prisma.distributor.update({ where: { id }, data: dto });
  }

  /**
   * 开通经销商门户访问权限
   *
   * 为经销商设置登录密码，开通门户访问。
   *
   * @param id - 经销商 ID
   * @param password - 登录密码
   * @returns 更新后的经销商
   * @throws BadRequestException - 经销商邮箱未设置
   */
  async enablePortal(id: string, password: string) {
    const distributor = await this.assertPlatformDistributor(id);
    if (!distributor.email) {
      throw new BadRequestException('Distributor email is required for portal access');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.distributor.update({
      where: { id },
      data: { portalEnabled: true, passwordHash },
    });
  }

  /**
   * 获取经销商详情
   *
   * 返回经销商的完整信息，包括：
   * - 基本信息
   * - 招募的分店数量
   * - 最近创建的邀请码（含完整 URL）
   *
   * @param id - 经销商 ID
   * @returns 经销商详情
   */
  async getById(id: string) {
    const d = await this.assertPlatformDistributor(id);
    const [recruitedCount, inviteCodes] = await Promise.all([
      this.prisma.merchantProfile.count({
        where: { recruitedByDistributorId: id },
      }),
      this.prisma.merchantRecruitInviteCode.findMany({
        where: { distributorId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);
    const baseUrl = this.env.get('MERCHANT_APP_URL') ?? 'http://localhost:3002';
    return {
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      commissionRate: Number(d.commissionRate),
      commissionType: d.commissionType,
      isActive: d.isActive,
      portalEnabled: d.portalEnabled,
      recruitedMerchantCount: recruitedCount,
      createdAt: d.createdAt.toISOString(),
      inviteCodes: inviteCodes.map((inv) => ({
        id: inv.id,
        code: inv.code,
        expiresAt: inv.expiresAt?.toISOString() ?? null,
        revokedAt: inv.revokedAt?.toISOString() ?? null,
        useCount: inv.useCount,
        url: `${baseUrl}/register?invite=${inv.code}`,
      })),
    };
  }

  /**
   * 为经销商创建商户招募邀请码
   *
   * 邀请码用于商户注册时绑定到招募的经销商。
   * 如果指定过期天数，码将在该天数后自动失效。
   *
   * @param distributorId - 经销商 ID
   * @param expiresInDays - 过期天数（可选，null 表示永不过期）
   * @returns 创建的邀请码详情（含完整注册 URL）
   * @throws ConflictException - 生成失败（罕见）
   */
  async createInviteCode(distributorId: string, expiresInDays?: number) {
    await this.assertPlatformDistributor(distributorId);
    for (let i = 0; i < 10; i++) {
      const code = generateInviteCode();
      try {
        const invite = await this.prisma.merchantRecruitInviteCode.create({
          data: {
            code,
            distributorId,
            expiresAt: expiresInDays
              ? new Date(Date.now() + expiresInDays * 86400000)
              : null,
          },
        });
        const baseUrl = this.env.get('MERCHANT_APP_URL') ?? 'http://localhost:3002';
        return {
          id: invite.id,
          code: invite.code,
          distributorId,
          expiresAt: invite.expiresAt?.toISOString() ?? null,
          revokedAt: null,
          useCount: 0,
          url: `${baseUrl}/register?invite=${code}`,
        };
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          continue;
        }
        throw err;
      }
    }
    throw new ConflictException('Could not generate invite code');
  }

  /**
   * 作废邀请码
   *
   * @param distributorId - 经销商 ID（校验归属）
   * @param codeId - 邀请码 ID
   * @returns 更新后的邀请码
   * @throws NotFoundException - 邀请码不存在
   * @throws BadRequestException - 邀请码已作废
   */
  async revokeInviteCode(distributorId: string, codeId: string) {
    await this.assertPlatformDistributor(distributorId);
    const invite = await this.prisma.merchantRecruitInviteCode.findFirst({
      where: { id: codeId, distributorId },
    });
    if (!invite) throw new NotFoundException('Invite code not found');
    if (invite.revokedAt) {
      throw new BadRequestException('Invite code already revoked');
    }
    return this.prisma.merchantRecruitInviteCode.update({
      where: { id: codeId },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * 获取经销商招募的分店列表
   *
   * 返回每个分店的：
   * - 基本信息（名称、slug）
   * - 招募时间
   * - 近30天销售数据（金额、订单数）
   *
   * @param distributorId - 经销商 ID
   * @returns 分店业绩汇总列表
   */
  async getBranches(distributorId: string) {
    await this.assertPlatformDistributor(distributorId);
    const windowStart = new Date();
    windowStart.setUTCDate(windowStart.getUTCDate() - 30);

    const merchants = await this.prisma.merchantProfile.findMany({
      where: { recruitedByDistributorId: distributorId },
      include: { tenant: true },
    });

    const summaries = await Promise.all(
      merchants.map(async (m) => {
        const agg = await this.prisma.order.aggregate({
          where: {
            tenantId: m.tenantId,
            status: { in: ['PAID', 'FULFILLED'] },
            createdAt: { gte: windowStart },
          },
          _sum: { total: true },
          _count: { _all: true },
        });
        return {
          tenantId: m.tenantId,
          merchantProfileId: m.id,
          businessName: m.businessName,
          slug: m.tenant.slug,
          recruitedAt: m.recruitedAt?.toISOString() ?? null,
          salesLast30Days: Number(agg._sum.total ?? 0),
          orderCountLast30Days: agg._count._all,
        };
      }),
    );
    return summaries;
  }

  /**
   * 校验是否为平台级经销商
   *
   * 内部辅助方法，确保操作的经销商属于平台（tenantId 为 null）。
   *
   * @param id - 经销商 ID
   * @returns 经销商对象
   * @throws NotFoundException - 经销商不存在或非平台级
   */
  private async assertPlatformDistributor(id: string) {
    const distributor = await this.prisma.distributor.findFirst({
      where: { id, tenantId: null },
    });
    if (!distributor) {
      throw new NotFoundException('Platform distributor not found');
    }
    return distributor;
  }
}
