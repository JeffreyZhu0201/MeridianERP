/**
 * StoreTenantService - 商店租户解析服务
 *
 * 负责解析和验证商户商店的租户信息。
 * 这是商店模块的核心服务，被其他服务广泛使用以确保多租户数据隔离。
 *
 * 核心功能：
 * - 根据 slug 解析商户商店
 * - 验证商店是否已审批通过（APPROVED 状态）
 *
 * 验证规则：
 * 1. Tenant 必须存在
 * 2. MerchantProfile 必须存在
 * 3. MerchantProfile.onboardingStatus 必须为 APPROVED
 *
 * 数据隔离：
 * - 所有商店模块的数据查询都应先通过此服务验证 tenant
 * - 确保游客和用户只能访问已审批商户的数据
 *
 * @service StoreTenantService
 */

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OnboardingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 可注入的租户解析服务
 * 提供商户商店的解析和验证功能
 */
@Injectable()
export class StoreTenantService {
  /**
   * 构造函数 - 注入 Prisma 数据库服务
   * @param prisma - Prisma 数据库服务
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 解析并验证已审批的商户商店
   *
   * 业务逻辑：
   * 1. 根据 slug 查找 Tenant（商户租户）
   * 2. 根据 tenantId 查找 MerchantProfile（商户档案）
   * 3. 验证商户档案存在且状态为 APPROVED
   *
   * @param slug - 商户商店的 URL 标识（Tenant.slug）
   * @returns 包含 tenant 和 profile 的对象
   * @throws NotFoundException - 商店不存在（Tenant 未找到）
   * @throws ForbiddenException - 商店未审批（状态不是 APPROVED）
   *
   * @example
   * const { tenant, profile } = await storeTenantService.resolveApprovedTenant('my-store');
   * // tenant: 商户租户信息
   * // profile: 商户档案信息（包含 businessName 等）
   */
  async resolveApprovedTenant(slug: string) {
    // 1. 根据 slug 查找商户租户
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      throw new NotFoundException('Store not found');
    }

    // 2. 根据 tenantId 查找商户档案
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { tenantId: tenant.id },
    });

    // 3. 验证商户档案存在且已审批
    if (!profile || profile.onboardingStatus !== OnboardingStatus.APPROVED) {
      throw new ForbiddenException('Store is not available');
    }

    return { tenant, profile };
  }
}
