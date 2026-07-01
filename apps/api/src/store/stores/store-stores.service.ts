/**
 * StoreStoresService - 商店列表服务
 *
 * 负责获取已审批通过的商户商店列表。
 * 用于商店发现功能，让消费者可以浏览和选择商店。
 *
 * 核心功能：
 * - 列出所有已审批通过的商户商店
 *
 * 数据筛选规则：
 * - 仅返回 onboardingStatus = APPROVED 的商户
 * - 按 displayName（商户商号）字母顺序排序
 *
 * @service StoreStoresService
 */

import { Injectable } from '@nestjs/common';
import { OnboardingStatus } from '@prisma/client';
import type { PublishedStoreListResponse } from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 可注入的商店列表服务
 * 提供商店发现功能
 */
@Injectable()
export class StoreStoresService {
  /**
   * 构造函数 - 注入 Prisma 数据库服务
   * @param prisma - Prisma 数据库服务
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取已发布的商店列表
   *
   * 功能：获取所有已审批通过的商户商店，供消费者选择
   *
   * 数据来源：
   * - 从 MerchantProfile 表查询 onboardingStatus = APPROVED 的记录
   * - 通过 tenantId 关联 Tenant 表获取 slug
   * - 使用 MerchantProfile 的 businessName 作为显示名称
   *
   * 排序规则：
   * - 按 displayName 字母升序排列（localeCompare）
   *
   * @returns 商店列表响应，包含商店 slug 和显示名称数组
   *
   * @example 返回数据结构
   * {
   *   items: [
   *     { slug: "store-a", displayName: "星巴克咖啡" },
   *     { slug: "store-b", displayName: "麦当劳" }
   *   ]
   * }
   */
  async listPublished(): Promise<PublishedStoreListResponse> {
    // 查询所有已审批通过的商户档案
    const profiles = await this.prisma.merchantProfile.findMany({
      // 只查询已审批通过的商户
      where: { onboardingStatus: OnboardingStatus.APPROVED },
      // 关联查询对应的租户信息
      include: { tenant: true },
    });

    // 映射并排序结果
    return {
      items: profiles
        .map((profile) => ({
          slug: profile.tenant.slug,        // 商店 URL 标识
          displayName: profile.businessName, // 商店显示名称
        }))
        // 按显示名称字母顺序排序
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    };
  }
}
