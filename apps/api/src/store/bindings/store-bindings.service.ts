/**
 * StoreBindingsService - 商店经销商绑定服务
 *
 * 负责处理商店消费者与经销商之间的绑定关系。
 * 消费者通过绑定令牌（token）绑定到特定的经销商，
 * 绑定后产生的订单可以关联到该经销商用于佣金计算。
 *
 * 核心功能：
 * - 消费者认领/绑定到经销商
 *
 * 业务规则：
 * - 消费者只能绑定到同一商户下的经销商
 * - 绑定令牌一次性使用，有效期由系统设定
 * - 绑定后，消费者的购物车会自动关联该经销商
 *
 * @service StoreBindingsService
 */

import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { BindingsService } from '../../bindings/bindings.service';
import { ClaimBindingDto } from '../../bindings/dto/claim-binding.dto';
import { StoreTenantService } from '../common/store-tenant.service';

/**
 * 可注入的商店绑定服务
 * 处理消费者与经销商的绑定操作
 */
@Injectable()
export class StoreBindingsService {
  /**
   * 构造函数 - 注入所需依赖
   * @param bindingsService - 通用绑定服务（BindingsService）
   * @param storeTenant - 商店租户解析服务
   */
  constructor(
    private readonly bindingsService: BindingsService,
    private readonly storeTenant: StoreTenantService,
  ) {}

  /**
   * 消费者认领绑定令牌
   *
   * 功能：消费者使用经销商分享的绑定令牌，绑定到该经销商
   *
   * 业务逻辑：
   * 1. 解析并验证商户商店
   * 2. 验证消费者属于该商户
   * 3. 调用通用绑定服务完成绑定
   *
   * @param slug - 商户商店的 URL 标识
   * @param user - 已认证用户（当前登录的消费者）
   * @param dto - 绑定令牌 DTO（包含 token）
   * @returns 绑定结果，包含 isExisting 标识是否为已存在的绑定
   * @throws ForbiddenException - 消费者不属于该商户商店
   *
   * @example
   * // 消费者A绑定到经销商B
   * POST /store/slug/bindings/claim
   * Body: { token: "DIST_TOKEN_xxx" }
   */
  async claim(slug: string, user: AuthenticatedUser, dto: ClaimBindingDto) {
    // 解析并验证商户商店
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);

    // 验证消费者属于该商户（防止跨商户绑定）
    if (user.tenantId !== tenant.id) {
      throw new ForbiddenException('Store context mismatch');
    }

    // 调用通用绑定服务完成绑定
    return this.bindingsService.claimCustomer(
      tenant.id,
      user.userId,
      dto.token,
    );
  }
}
