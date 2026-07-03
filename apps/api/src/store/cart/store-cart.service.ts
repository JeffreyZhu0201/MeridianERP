import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { InventoryService } from '../../inventory/inventory.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StoreAuthService } from '../auth/store-auth.service';
import { StoreTenantService } from '../common/store-tenant.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

const CART_INCLUDE = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, isPublished: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' as const }, // 按添加时间升序排列
  },
  distributor: { select: { id: true, name: true } }, // 关联的经销商信息
};

@Injectable()
export class StoreCartService {
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeTenant: StoreTenantService,
    private readonly storeAuth: StoreAuthService,
    private readonly inventoryService: InventoryService,
  ) {}

  
  private async resolveCart(
    tenantId: string,
    sessionId: string | undefined,
    user: AuthenticatedUser | undefined,
  ): Promise<{
    cart: Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>;
    sessionId: string | undefined;
  }> {
    if (user?.userId) {
      const customerId = await this.storeAuth.resolveCustomerId(user.userId, tenantId);
      let cart = await this.prisma.cart.findFirst({
        where: { tenantId, customerId },
        include: CART_INCLUDE,
      });
      if (!cart) {
        cart = await this.prisma.cart.create({
          data: {
            tenantId,
            customerId,
            sessionId: sessionId ?? null,
          },
          include: CART_INCLUDE,
        });
      } else if (sessionId && !cart.sessionId) {
        cart = await this.prisma.cart.update({
          where: { id: cart.id },
          data: { sessionId },
          include: CART_INCLUDE,
        });
      }

      return { cart, sessionId: sessionId ?? cart.sessionId ?? undefined };
    }
    if (!sessionId) {
      throw new BadRequestException(
        'X-Cart-Session header is required for guest carts',
      );
    }

    let cart = await this.prisma.cart.findFirst({
      where: { tenantId, sessionId, customerId: null },
      include: CART_INCLUDE,
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { tenantId, sessionId },
        include: CART_INCLUDE,
      });
    }

    return { cart, sessionId };
  }

  
  async getCart(
    slug: string,
    sessionId: string | undefined,
    user?: AuthenticatedUser,
  ) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    const { cart, sessionId: resolvedSession } = await this.resolveCart(
      tenant.id,
      sessionId,
      user,
    );
    return this.formatCart(cart, resolvedSession);
  }

  
  async addItem(
    slug: string,
    dto: AddCartItemDto,
    sessionId: string | undefined,
    user?: AuthenticatedUser,
  ) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    const guestSession = sessionId ?? randomUUID();
    const { cart } = await this.resolveCart(
      tenant.id,
      user ? sessionId : guestSession,
      user,
    );
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id: dto.variantId,
        isActive: true, // 规格必须活跃
        product: { tenantId: tenant.id, isPublished: true }, // 商品必须已发布
      },
    });
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }
    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: { cartId: cart.id, variantId: dto.variantId },
      },
    });
    const requestedQty = (existing?.quantity ?? 0) + dto.quantity;
    const sellable = await this.inventoryService.getSellableQuantity(variant.id);
    if (sellable < requestedQty) {
      throw new BadRequestException('Insufficient inventory');
    }

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: dto.variantId,
          quantity: dto.quantity,
        },
      });
    }
    const updated = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: CART_INCLUDE,
    });
    return this.formatCart(updated, user ? sessionId : guestSession);
  }

  
  async updateItem(
    slug: string,
    itemId: string,
    dto: UpdateCartItemDto,
    sessionId: string | undefined,
    user?: AuthenticatedUser,
  ) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    const { cart, sessionId: resolvedSession } = await this.resolveCart(
      tenant.id,
      sessionId,
      user,
    );
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }
    const sellable = await this.inventoryService.getSellableQuantity(item.variantId);
    if (sellable < dto.quantity) {
      throw new BadRequestException('Insufficient inventory');
    }
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
    const updated = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: CART_INCLUDE,
    });
    return this.formatCart(updated, resolvedSession);
  }

  
  async removeItem(
    slug: string,
    itemId: string,
    sessionId: string | undefined,
    user?: AuthenticatedUser,
  ) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    const { cart, sessionId: resolvedSession } = await this.resolveCart(
      tenant.id,
      sessionId,
      user,
    );
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    const updated = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: CART_INCLUDE,
    });
    return this.formatCart(updated, resolvedSession);
  }

  private formatCart(
    cart: Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>,
    sessionId?: string,
  ) {
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.variant.price) * item.quantity;
    }, 0);

    return {
      id: cart.id,
      sessionId: sessionId ?? cart.sessionId ?? randomUUID(), // 确保有 sessionId
      distributorId: cart.distributorId, // 关联的经销商 ID
      distributor: cart.distributor, // 经销商信息
      items: cart.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        variant: item.variant,
        lineTotal: Number(item.variant.price) * item.quantity, // 该商品的小计
      })),
      subtotal, // 购物车总金额
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0), // 商品总数量
    };
  }
}
