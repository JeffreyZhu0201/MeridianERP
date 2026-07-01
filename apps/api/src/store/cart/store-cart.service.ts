/**
 * StoreCartService - 购物车服务
 *
 * 负责管理商店消费者的购物车功能，包括：
 * - 获取购物车
 * - 添加商品到购物车
 * - 更新购物车商品数量
 * - 删除购物车商品
 *
 * 购物车模式：
 * - 已登录用户：按 customerId 关联购物车
 * - 游客：按 sessionId 关联购物车
 *
 * 特殊功能：
 * - 自动从_binding表填充经销商信息（如果用户已绑定经销商）
 * - 支持游客和已登录用户混合使用
 *
 * @service StoreCartService
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BindType, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { StoreTenantService } from '../common/store-tenant.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

/**
 * 购物车查询包含配置
 * 预加载购物车商品、规格及关联商品信息
 */
const CART_INCLUDE = {
  items: {
    include: {
      variant: {
        include: { product: { select: { id: true, name: true, slug: true, isPublished: true } } },
      },
    },
    orderBy: { createdAt: 'asc' as const },  // 按添加时间升序排列
  },
  distributor: { select: { id: true, name: true } },  // 关联的经销商信息
};

/**
 * 可注入的购物车服务
 * 处理购物车的增删改查操作
 */
@Injectable()
export class StoreCartService {
  /**
   * 构造函数 - 注入所需依赖
   * @param prisma - Prisma 数据库服务
   * @param storeTenant - 商店租户解析服务
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeTenant: StoreTenantService,
  ) {}

  /**
   * 解析并获取购物车（私有方法）
   *
   * 根据用户是否登录选择不同的购物车查找策略：
   * - 已登录用户：按 tenantId + customerId 查找
   * - 游客：按 tenantId + sessionId 查找
   *
   * 同时处理以下逻辑：
   * - 如果购物车不存在，自动创建
   * - 如果用户绑定了经销商，自动填充到购物车
   *
   * @param tenantId - 商户租户 ID
   * @param sessionId - 游客会话 ID（游客必需）
   * @param user - 已认证用户（可选）
   * @returns 购物车对象和解析后的 sessionId
   * @throws BadRequestException - 游客但未提供 sessionId
   */
  private async resolveCart(
    tenantId: string,
    sessionId: string | undefined,
    user: AuthenticatedUser | undefined,
  ): Promise<{
    cart: Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>;
    sessionId: string | undefined;
  }> {
    // 已登录用户：按 customerId 查找购物车
    if (user?.userId && user.tenantId === tenantId) {
      let cart = await this.prisma.cart.findFirst({
        where: { tenantId, customerId: user.userId },
        include: CART_INCLUDE,
      });

      // 购物车不存在则创建
      if (!cart) {
        cart = await this.prisma.cart.create({
          data: {
            tenantId,
            customerId: user.userId,
            sessionId: sessionId ?? null,
          },
          include: CART_INCLUDE,
        });
      } else if (sessionId && !cart.sessionId) {
        // 如果有新的 sessionId，更新购物车
        cart = await this.prisma.cart.update({
          where: { id: cart.id },
          data: { sessionId },
          include: CART_INCLUDE,
        });
      }

      // 如果购物车没有关联经销商，尝试从 binding 表填充
      if (!cart.distributorId) {
        cart = await this.hydrateDistributorFromBinding(
          cart,
          tenantId,
          user.userId,
        );
      }

      return { cart, sessionId: sessionId ?? cart.sessionId ?? undefined };
    }

    // 游客：必须提供 sessionId
    if (!sessionId) {
      throw new BadRequestException('X-Cart-Session header is required for guest carts');
    }

    let cart = await this.prisma.cart.findFirst({
      where: { tenantId, sessionId, customerId: null },
      include: CART_INCLUDE,
    });

    // 购物车不存在则创建
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { tenantId, sessionId },
        include: CART_INCLUDE,
      });
    }

    return { cart, sessionId };
  }

  /**
   * 获取购物车
   *
   * @param slug - 商户商店的 URL 标识
   * @param sessionId - 游客会话 ID（可选）
   * @param user - 已认证用户（可选）
   * @returns 格式化后的购物车信息
   */
  async getCart(slug: string, sessionId: string | undefined, user?: AuthenticatedUser) {
    // 解析并验证商户商店
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);

    // 获取购物车
    const { cart, sessionId: resolvedSession } = await this.resolveCart(
      tenant.id,
      sessionId,
      user,
    );

    // 返回格式化后的购物车
    return this.formatCart(cart, resolvedSession);
  }

  /**
   * 添加商品到购物车
   *
   * 业务逻辑：
   * 1. 解析并验证商户商店
   * 2. 获取或创建购物车
   * 3. 验证商品规格存在且可用
   * 4. 如果规格已在购物车中，增加数量
   * 5. 否则添加新的购物车商品
   *
   * @param slug - 商户商店的 URL 标识
   * @param dto - 添加商品信息（variantId, quantity）
   * @param sessionId - 游客会话 ID
   * @param user - 已认证用户（可选）
   * @returns 更新后的购物车信息
   * @throws NotFoundException - 商品规格不存在或不可用
   */
  async addItem(
    slug: string,
    dto: AddCartItemDto,
    sessionId: string | undefined,
    user?: AuthenticatedUser,
  ) {
    // 解析并验证商户商店
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);

    // 为游客生成临时 sessionId
    const guestSession = sessionId ?? randomUUID();

    // 获取或创建购物车
    const { cart } = await this.resolveCart(
      tenant.id,
      user ? sessionId : guestSession,
      user,
    );

    // 验证商品规格存在且可用
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id: dto.variantId,
        isActive: true,  // 规格必须活跃
        product: { tenantId: tenant.id, isPublished: true },  // 商品必须已发布
      },
    });
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    // 检查该规格是否已在购物车中
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: dto.variantId } },
    });

    if (existing) {
      // 已在购物车，增加数量
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
      });
    } else {
      // 不在购物车，添加新商品
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, variantId: dto.variantId, quantity: dto.quantity },
      });
    }

    // 获取更新后的购物车并返回
    const updated = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: CART_INCLUDE,
    });
    return this.formatCart(updated, user ? sessionId : guestSession);
  }

  /**
   * 更新购物车商品数量
   *
   * @param slug - 商户商店的 URL 标识
   * @param itemId - 购物车商品 ID
   * @param dto - 更新信息（quantity）
   * @param sessionId - 游客会话 ID
   * @param user - 已认证用户（可选）
   * @returns 更新后的购物车信息
   * @throws NotFoundException - 购物车商品不存在
   */
  async updateItem(
    slug: string,
    itemId: string,
    dto: UpdateCartItemDto,
    sessionId: string | undefined,
    user?: AuthenticatedUser,
  ) {
    // 解析并验证商户商店
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);

    // 获取购物车
    const { cart, sessionId: resolvedSession } = await this.resolveCart(
      tenant.id,
      sessionId,
      user,
    );

    // 验证购物车商品存在
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    // 更新商品数量
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    // 获取更新后的购物车并返回
    const updated = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: CART_INCLUDE,
    });
    return this.formatCart(updated, resolvedSession);
  }

  /**
   * 从购物车删除商品
   *
   * @param slug - 商户商店的 URL 标识
   * @param itemId - 购物车商品 ID
   * @param sessionId - 游客会话 ID
   * @param user - 已认证用户（可选）
   * @returns 更新后的购物车信息
   * @throws NotFoundException - 购物车商品不存在
   */
  async removeItem(
    slug: string,
    itemId: string,
    sessionId: string | undefined,
    user?: AuthenticatedUser,
  ) {
    // 解析并验证商户商店
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);

    // 获取购物车
    const { cart, sessionId: resolvedSession } = await this.resolveCart(
      tenant.id,
      sessionId,
      user,
    );

    // 验证购物车商品存在
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    // 删除购物车商品
    await this.prisma.cartItem.delete({ where: { id: itemId } });

    // 获取更新后的购物车并返回
    const updated = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: CART_INCLUDE,
    });
    return this.formatCart(updated, resolvedSession);
  }

  /**
   * 从 binding 表填充经销商信息（私有方法）
   *
   * 如果用户已经通过 binding 绑定到某个经销商，
   * 自动将该经销商信息填充到购物车的 distributorId 字段。
   *
   * @param cart - 购物车对象
   * @param tenantId - 商户租户 ID
   * @param customerId - 消费者 ID
   * @returns 更新后的购物车（包含 distributorId）
   */
  private async hydrateDistributorFromBinding(
    cart: Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>,
    tenantId: string,
    customerId: string,
  ) {
    // 查找消费者的绑定记录
    const binding = await this.prisma.binding.findUnique({
      where: {
        bindableType_bindableId: {
          bindableType: BindType.CUSTOMER,
          bindableId: customerId,
        },
      },
    });

    // 如果绑定存在且在同一商户下，更新购物车
    if (!binding || binding.tenantId !== tenantId) {
      return cart;
    }

    return this.prisma.cart.update({
      where: { id: cart.id },
      data: { distributorId: binding.distributorId },
      include: CART_INCLUDE,
    });
  }

  /**
   * 格式化购物车响应（私有方法）
   *
   * 将数据库购物车对象转换为 API 响应格式，
   * 计算小计和商品总数。
   *
   * @param cart - 数据库购物车对象
   * @param sessionId - 会话 ID
   * @returns 格式化后的购物车响应
   */
  private formatCart(
    cart: Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>,
    sessionId?: string,
  ) {
    // 计算商品小计
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.variant.price) * item.quantity;
    }, 0);

    return {
      id: cart.id,
      sessionId: sessionId ?? cart.sessionId ?? randomUUID(),  // 确保有 sessionId
      distributorId: cart.distributorId,  // 关联的经销商 ID
      distributor: cart.distributor,       // 经销商信息
      items: cart.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        variant: item.variant,
        lineTotal: Number(item.variant.price) * item.quantity,  // 该商品的小计
      })),
      subtotal,                             // 购物车总金额
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),  // 商品总数量
    };
  }
}
