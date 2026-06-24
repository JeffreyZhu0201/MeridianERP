import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { StoreTenantService } from '../common/store-tenant.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

const CART_INCLUDE = {
  items: {
    include: {
      variant: {
        include: { product: { select: { id: true, name: true, slug: true, isPublished: true } } },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  distributor: { select: { id: true, name: true } },
};

@Injectable()
export class StoreCartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeTenant: StoreTenantService,
  ) {}

  private async resolveCart(
    tenantId: string,
    sessionId: string | undefined,
    user: AuthenticatedUser | undefined,
  ): Promise<{
    cart: Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>;
    sessionId: string | undefined;
  }> {
    if (user?.userId && user.tenantId === tenantId) {
      let cart = await this.prisma.cart.findFirst({
        where: { tenantId, customerId: user.userId },
        include: CART_INCLUDE,
      });
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
        cart = await this.prisma.cart.update({
          where: { id: cart.id },
          data: { sessionId },
          include: CART_INCLUDE,
        });
      }
      return { cart, sessionId: sessionId ?? cart.sessionId ?? undefined };
    }

    if (!sessionId) {
      throw new BadRequestException('X-Cart-Session header is required for guest carts');
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

  async getCart(slug: string, sessionId: string | undefined, user?: AuthenticatedUser) {
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
        isActive: true,
        product: { tenantId: tenant.id, isPublished: true },
      },
    });
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: dto.variantId } },
    });
    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, variantId: dto.variantId, quantity: dto.quantity },
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
      sessionId: sessionId ?? cart.sessionId ?? randomUUID(),
      distributorId: cart.distributorId,
      distributor: cart.distributor,
      items: cart.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        variant: item.variant,
        lineTotal: Number(item.variant.price) * item.quantity,
      })),
      subtotal,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }
}
